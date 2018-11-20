const AppChain = require('@appchain/base').default
const ethJSABI = require('ethjs-abi')
const StatusError = require('./statuserror.js')
const log = require('../utils/log').title('contract/utils')

const appchain = AppChain()

const Utils = {
  is_object: function(val) {
    return typeof val == 'object' && !Array.isArray(val)
  },
  is_big_number: function(val) {
    return appchain.utils.isBigNumber(val) || appchain.utils.isBN(val)
  },
  decodeLogs: function(C, instance, logs) {
    return logs
      .map(function(log) {
        var logABI = C.events[log.topics[0]]

        if (logABI == null) {
          return null
        }

        // This function has been adapted from appchain's SolidityEvent.decode() method,
        // and built to work with ethjs-abi.

        const copy = Utils.merge({}, log)

        function partialABI(fullABI, indexed) {
          var inputs = fullABI.inputs.filter(function(i) {
            return i.indexed === indexed
          })

          var partial = {
            inputs: inputs,
            name: fullABI.name,
            type: fullABI.type,
            anonymous: fullABI.anonymous,
          }

          return partial
        }

        var argTopics = logABI.anonymous ? copy.topics : copy.topics.slice(1)
        var indexedData =
          '0x' +
          argTopics
            .map(function(topics) {
              return topics.slice(2)
            })
            .join('')
        var indexedParams = ethJSABI.decodeEvent(partialABI(logABI, true), indexedData)

        var notIndexedData = copy.data
        var notIndexedParams = ethJSABI.decodeEvent(partialABI(logABI, false), notIndexedData)

        copy.event = logABI.name

        copy.args = logABI.inputs.reduce(function(acc, current) {
          var val = indexedParams[current.name]

          if (val === undefined) {
            val = notIndexedParams[current.name]
          }

          acc[current.name] = val
          return acc
        }, {})

        Object.keys(copy.args).forEach(function(key) {
          var val = copy.args[key]

          // We have BN. Convert it to BigNumber
          if (val.constructor.isBN) {
            copy.args[key] = C.appchain.toBN('0x' + val.toString(16))
          }
        })

        delete copy.data
        delete copy.topics

        return copy
      })
      .filter(function(log) {
        return log != null
      })
  },
  promisifyFunction: function(fn, C) {
    var self = this
    return function() {
      var instance = this

      var args = Array.prototype.slice.call(arguments)
      var tx_params = {}
      var last_arg = args[args.length - 1]

      // It's only tx_params if it's an object and not a BigNumber.
      if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
        tx_params = args.pop()
      }

      tx_params = Utils.merge(C.class_defaults, tx_params)

      return C.detectNetwork().then(function() {
        return new Promise(function(accept, reject) {
          // var callback = function(error, result) {
          //   if (error != null) {
          //     reject(error)
          //   } else {
          //     accept(result)
          //   }
          // }
          args.push(tx_params)
          log('args', args)
          log(fn)
          fn.apply(instance.contract, args)
            .then((res) => {
              accept(res)
            })
            .catch((err) => {
              reject(err)
            })
        })
      })
    }
  },
  synchronizeFunction: function(fn, instance, C) {
    var self = this
    return function() {
      var args = Array.prototype.slice.call(arguments)
      var tx_params = {}
      var last_arg = args[args.length - 1]

      // It's only tx_params if it's an object and not a BigNumber.
      if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
        tx_params = args.pop()
      }

      tx_params = Utils.merge(C.class_defaults, tx_params)

      return C.detectNetwork().then(function() {
        return new Promise(function(accept, reject) {
          var callback = function(error, tx) {
            if (error != null) {
              reject(error)
              return
            }

            let timeout
            if (C.synchronization_timeout === 0 || C.synchronization_timeout !== undefined) {
              timeout = C.synchronization_timeout
            } else {
              timeout = 240000
            }

            const start = new Date().getTime()

            const make_attempt = function() {
              C.appchain.base.getTransactionReceipt(tx, function(err, receipt) {
                if (err && !err.toString().includes('unknown transaction')) {
                  return reject(err)
                }

                // Reject on transaction failures, accept otherwise
                // Handles "0x00" or hex 0
                if (receipt != null) {
                  if (parseInt(receipt.status, 16) == 0) {
                    var statusError = new StatusError(tx_params, tx, receipt)
                    return reject(statusError)
                  } else {
                    return accept({
                      tx: tx,
                      receipt: receipt,
                      logs: Utils.decodeLogs(C, instance, receipt.logs),
                    })
                  }
                }

                if (timeout > 0 && new Date().getTime() - start > timeout) {
                  return reject(new Error('Transaction ' + tx + " wasn't processed in " + timeout / 1000 + ' seconds!'))
                }

                setTimeout(make_attempt, 1000)
              })
            }

            make_attempt()
          }

          args.push(tx_params, callback)
          fn.apply(self, args)
        })
      })
    }
  },
  merge: function() {
    var merged = {}
    var args = Array.prototype.slice.call(arguments)

    for (var i = 0; i < args.length; i++) {
      var object = args[i]
      var keys = Object.keys(object)
      for (var j = 0; j < keys.length; j++) {
        var key = keys[j]
        var value = object[key]
        merged[key] = value
      }
    }

    return merged
  },
  parallel: function(arr, callback) {
    callback = callback || function() {}
    if (!arr.length) {
      return callback(null, [])
    }
    var index = 0
    var results = new Array(arr.length)
    arr.forEach(function(fn, position) {
      fn(function(err, result) {
        if (err) {
          callback(err)
          callback = function() {}
        } else {
          index++
          results[position] = result
          if (index >= arr.length) {
            callback(null, results)
          }
        }
      })
    })
  },
  addClassMethodsAndProperties: function(Class) {
    const cls = Class
    // Add our static methods
    Object.keys(cls._static_methods).forEach(function(key) {
      cls[key] = cls._static_methods[key].bind(cls)
    })

    // Add our properties.
    Object.keys(cls._properties).forEach(function(key) {
      cls.addProp(key, cls._properties[key])
    })

    return cls
  },
  linkBytecode: function(bytecode, links) {
    Object.keys(links).forEach(function(library_name) {
      var library_address = links[library_name]
      var regex = new RegExp('__' + library_name + '_+', 'g')

      bytecode = bytecode.replace(regex, library_address.replace('0x', ''))
    })

    return bytecode
  },
}

module.exports = Utils
