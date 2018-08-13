var ethJSABI = require('ethjs-abi')
var BlockchainUtils = require('truffle-blockchain-utils')
var Web3 = require('@nervos/web3')
var StatusError = require('./statuserror.js')
const log: any = console.log.bind(console, '-- contract.js --\n')
import Utils from './utils'

// For browserified version. If browserify gave us an empty version,
// look for the one provided by the user.
// if (typeof Web3 == 'object' && Object.keys(Web3).length == 0) {
//   Web3 = global.Web3
// }

class Provider {
  provider: any
  constructor(provider) {
    this.provider = provider
  }
  send() {
    return this.provider.send.apply(this.provider, arguments)
  }
  sendAsync() {
    return this.provider.sendAsync.apply(this.provider, arguments)
  }
}

class TruffleContract {
  constructor() {
    return Contract.apply(this, arguments)
  }
  static _static_methods
  static _properties
  static _property_values
  static _json
  static web3
  static class_defaults
  static setNetwork

  defaults
}

class Contract {
  constructor(contract) {
    if (typeof contract == 'string') {
      var constructor = Contract
      var address = contract
      var contract_class = constructor.web3.eth.contract(this.abi)
      contract = contract_class.at(address)
    }
    this.contract = contract

    const _properties = {
      contract_name: {
        get: function() {
          return this.contractName
        },
        set: function(val) {
          this.contractName = val
        },
      },
      contractName: {
        get: function() {
          return this._json.contractName || 'Contract'
        },
        set: function(val) {
          this._json.contractName = val
        },
      },
      abi: {
        get: function() {
          return this._json.abi
        },
        set: function(val) {
          this._json.abi = val
        },
      },
      network: function() {
        var network_id = this.network_id

        if (network_id == null) {
          throw new Error(
            this.contractName +
              ' has no network id set, cannot lookup artifact data. Either set the network manually using ' +
              this.contractName +
              '.setNetwork(), run ' +
              this.contractName +
              '.detectNetwork(), or use new(), at() or deployed() as a thenable which will detect the network automatically.'
          )
        }

        // TODO: this might be bad; setting a value on a get.
        if (this._json.networks[network_id] == null) {
          throw new Error(
            this.contractName + ' has no network configuration for its current network id (' + network_id + ').'
          )
        }

        var returnVal = this._json.networks[network_id]

        // Normalize output
        if (returnVal.links == null) {
          returnVal.links = {}
        }

        if (returnVal.events == null) {
          returnVal.events = {}
        }

        return returnVal
      },
      networks: function() {
        return this._json.networks
      },
      address: {
        get: function() {
          var address = this.network.address

          if (address == null) {
            throw new Error('Cannot find deployed address: ' + this.contractName + ' not deployed or address not set.')
          }

          return address
        },
        set: function(val) {
          if (val == null) {
            throw new Error('Cannot set deployed address; malformed value: ' + val)
          }

          var network_id = this.network_id

          if (network_id == null) {
            throw new Error(
              this.contractName +
                ' has no network id set, cannot lookup artifact data. Either set the network manually using ' +
                this.contractName +
                '.setNetwork(), run ' +
                this.contractName +
                '.detectNetwork(), or use new(), at() or deployed() as a thenable which will detect the network automatically.'
            )
          }

          // Create a network if we don't have one.
          if (this._json.networks[network_id] == null) {
            this._json.networks[network_id] = {
              events: {},
              links: {},
            }
          }

          // Finally, set the address.
          this.network.address = val
        },
      },
      transactionHash: {
        get: function() {
          var transactionHash = this.network.transactionHash

          if (transactionHash === null) {
            throw new Error('Could not find transaction hash for ' + this.contractName)
          }

          return transactionHash
        },
        set: function(val) {
          this.network.transactionHash = val
        },
      },
      links: function() {
        if (!this.network_id) {
          throw new Error(
            this.contractName +
              ' has no network id set, cannot lookup artifact data. Either set the network manually using ' +
              this.contractName +
              '.setNetwork(), run ' +
              this.contractName +
              '.detectNetwork(), or use new(), at() or deployed() as a thenable which will detect the network automatically.'
          )
        }

        if (this._json.networks[this.network_id] == null) {
          return {}
        }

        return this.network.links || {}
      },
      events: function() {
        // helper web3; not used for provider
        var web3 = new Web3()

        var events

        if (this._json.networks[this.network_id] == null) {
          events = {}
        } else {
          events = this.network.events || {}
        }

        // Merge abi events with whatever's returned.
        var abi = this.abi

        abi.forEach(function(item) {
          if (item.type != 'event') return

          var signature = item.name + '('

          item.inputs.forEach(function(input, index) {
            signature += input.type

            if (index < item.inputs.length - 1) {
              signature += ','
            }
          })

          signature += ')'

          var topic = web3.sha3(signature)

          events[topic] = item
        })

        return events
      },
      binary: function() {
        return Utils.linkBytecode(this.bytecode, this.links)
      },
      deployedBinary: function() {
        return Utils.linkBytecode(this.deployedBytecode, this.links)
      },
      // deprecated; use bytecode
      unlinked_binary: {
        get: function() {
          return this.bytecode
        },
        set: function(val) {
          this.bytecode = val
        },
      },
      // alias for unlinked_binary; unlinked_binary will eventually be deprecated
      bytecode: {
        get: function() {
          return this._json.bytecode
        },
        set: function(val) {
          this._json.bytecode = val
        },
      },
      deployedBytecode: {
        get: function() {
          var code = this._json.deployedBytecode

          if (code.indexOf('0x') != 0) {
            code = '0x' + code
          }

          return code
        },
        set: function(val) {
          var code = val

          if (val.indexOf('0x') != 0) {
            code = '0x' + code
          }

          this._json.deployedBytecode = code
        },
      },
      sourceMap: {
        get: function() {
          return this._json.sourceMap
        },
        set: function(val) {
          this._json.sourceMap = val
        },
      },
      deployedSourceMap: {
        get: function() {
          return this._json.deployedSourceMap
        },
        set: function(val) {
          this._json.deployedSourceMap = val
        },
      },
      source: {
        get: function() {
          return this._json.source
        },
        set: function(val) {
          this._json.source = val
        },
      },
      sourcePath: {
        get: function() {
          return this._json.sourcePath
        },
        set: function(val) {
          this._json.sourcePath = val
        },
      },
      legacyAST: {
        get: function() {
          return this._json.legacyAST
        },
        set: function(val) {
          this._json.legacyAST = val
        },
      },
      ast: {
        get: function() {
          return this._json.ast
        },
        set: function(val) {
          this._json.ast = val
        },
      },
      compiler: {
        get: function() {
          return this._json.compiler
        },
        set: function(val) {
          this._json.compiler = val
        },
      },
      // Deprecated
      schema_version: function() {
        return this.schemaVersion
      },
      schemaVersion: function() {
        return this._json.schemaVersion
      },
      // deprecated
      updated_at: function() {
        return this.updatedAt
      },
      updatedAt: function() {
        try {
          return this.network.updatedAt || this._json.updatedAt
        } catch (e) {
          return this._json.updatedAt
        }
      },
    }
    Object.keys(_properties).forEach(function(key) {
      constructor.addProp(key, _properties[key])
    })
    // Utils.bootstrap(Contract)
  }

  provider: any
  contract: any
  _json: any
  then: any
  network: any
  abi: any

  static _property_values: any
  static currentProvider: any
  static contractName: any
  static _json: any
  static binary: any
  static bytecode: any
  static abi: any
  static web3: any
  static class_defaults: any
  static address: any
  static network_id: any
  static network: any
  static networks: any
  static _static_methods: any
  static _properties: any

  static setProvider(provider) {
    if (!provider) {
      throw new Error('Invalid provider passed to setProvider(); provider is ' + provider)
    }

    var wrapped = new Provider(provider)
    this.web3.setProvider(wrapped)
    this.currentProvider = provider
  }
  static new() {
    var self = this

    if (this.currentProvider == null) {
      throw new Error(this.contractName + ' error: Please call setProvider() first before calling new().')
    }

    var args = Array.prototype.slice.call(arguments)

    if (!this.bytecode) {
      throw new Error(this._json.contractName + " error: contract binary not set. Can't deploy new instance.")
    }

    return self
      .detectNetwork()
      .then(function(network_id) {
        // After the network is set, check to make sure everything's ship shape.
        var regex = /__[^_]+_+/g
        var unlinked_libraries = self.binary.match(regex)

        if (unlinked_libraries != null) {
          unlinked_libraries = unlinked_libraries
            .map(function(name) {
              // Remove underscores
              return name.replace(/_/g, '')
            })
            .sort()
            .filter(function(name, index, arr) {
              // Remove duplicates
              if (index + 1 >= arr.length) {
                return true
              }

              return name != arr[index + 1]
            })
            .join(', ')

          throw new Error(
            self.contractName +
              ' contains unresolved libraries. You must deploy and link the following libraries before you can deploy a new version of ' +
              self._json.contractName +
              ': ' +
              unlinked_libraries
          )
        }
      })
      .then(function() {
        return new Promise(function(accept, reject) {
          var contract_class = self.web3.eth.contract(self.abi)
          interface tx_params {
            data: any
          }
          let tx_params
          var last_arg = args[args.length - 1]

          // It's only tx_params if it's an object and not a BigNumber.
          if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
            tx_params = args.pop()
          }

          // Validate constructor args
          var constructor = self.abi.filter(function(item) {
            return item.type === 'constructor'
          })

          if (constructor.length && constructor[0].inputs.length !== args.length) {
            throw new Error(
              self.contractName +
                ' contract constructor expected ' +
                constructor[0].inputs.length +
                ' arguments, received ' +
                args.length
            )
          }

          tx_params = Utils.merge(self.class_defaults, tx_params)

          if (tx_params.data == null) {
            tx_params.data = self.binary
          }

          // web3 0.9.0 and above calls new this callback twice.
          // Why, I have no idea...
          var intermediary = function(err, web3_instance) {
            if (err != null) {
              reject(err)
              return
            }

            if (err == null && web3_instance != null && web3_instance.address != null) {
              accept(new self(web3_instance))
            }
          }

          args.push(tx_params, intermediary)
          contract_class.new.apply(contract_class, args)
        })
      })
  }

  static at(address) {
    var self = this

    if (address == null || typeof address != 'string' || address.length != 42) {
      throw new Error('Invalid address passed to ' + this._json.contractName + '.at(): ' + address)
    }

    var contract = new this(address)

    // Add thennable to allow people opt into new recommended usage.
    contract.then = function(fn) {
      return self
        .detectNetwork()
        .then(function(network_id) {
          var instance = new self(address)

          return new Promise(function(accept, reject) {
            self.web3.eth.getCode(address, function(err, code) {
              if (err) return reject(err)

              if (!code || code.replace('0x', '').replace(/0/g, '') === '') {
                return reject(
                  new Error('Cannot create instance of ' + self.contractName + '; no code at address ' + address)
                )
              }

              accept(instance)
            })
          })
        })
        .then(fn)
    }

    return contract
  }

  static deployed() {
    var self = this
    return self.detectNetwork().then(function() {
      // We don't have a network config for the one we found
      if (self._json.networks[self.network_id] == null) {
        throw new Error(self.contractName + ' has not been deployed to detected network (network/artifact mismatch)')
      }

      // If we found the network but it's not deployed
      if (!self.isDeployed()) {
        throw new Error(self.contractName + ' has not been deployed to detected network (' + self.network_id + ')')
      }

      return new self(self.address)
    })
  }

  static defaults(class_defaults) {
    if (this.class_defaults == null) {
      this.class_defaults = {}
    }

    if (class_defaults == null) {
      class_defaults = {}
    }

    var self = this
    Object.keys(class_defaults).forEach(function(key) {
      var value = class_defaults[key]
      self.class_defaults[key] = value
    })

    return this.class_defaults
  }

  static hasNetwork(network_id) {
    return this._json.networks[network_id + ''] != null
  }

  static isDeployed() {
    try {
      log('is deployed this.network:', this.network)
    } catch (e) {}
    if (this.network_id == null) {
      return false
    }

    if (this._json.networks[this.network_id] == null) {
      return false
    }

    return !!this.network.address
  }

  static detectNetwork() {
    var self = this

    return new Promise(function(accept, reject) {
      // Try to detect the network we have artifacts for.
      if (self.network_id) {
        // We have a network id and a configuration, let's go with it.
        if (self.networks[self.network_id] != null) {
          return accept(self.network_id)
        }
      }

      self.web3.version.getNetwork(function(err, result) {
        if (err) return reject(err)

        var network_id = result.toString()

        // If we found the network via a number, let's use that.
        if (self.hasNetwork(network_id)) {
          self.setNetwork(network_id)
          return accept()
        }

        // Otherwise, go through all the networks that are listed as
        // blockchain uris and see if they match.
        var uris = Object.keys(self._json.networks).filter(function(network) {
          return network.indexOf('blockchain://') == 0
        })

        var matches = uris.map(function(uri) {
          return BlockchainUtils.matches.bind(BlockchainUtils, uri, self.web3.currentProvider)
        })

        Utils.parallel(matches, function(err, results) {
          if (err) return reject(err)

          for (var i = 0; i < results.length; i++) {
            if (results[i]) {
              self.setNetwork(uris[i])
              return accept()
            }
          }

          // We found nothing. Set the network id to whatever the provider states.
          self.setNetwork(network_id)

          accept()
        })
      })
    })
  }

  static setNetwork(network_id) {
    if (!network_id) return
    this.network_id = network_id + ''
  }

  // Overrides the deployed address to null.
  // You must call this explicitly so you don't inadvertently do this otherwise.
  static resetAddress() {
    delete this.network.address
  }

  static link(name, address) {
    var self = this

    if (typeof name == 'function') {
      var contract = name

      if (contract.isDeployed() == false) {
        throw new Error('Cannot link contract without an address.')
      }

      this.link(contract.contractName, contract.address)

      // Merge events so this contract knows about library's events
      Object.keys(contract.events).forEach(function(topic) {
        self.network.events[topic] = contract.events[topic]
      })

      return
    }

    if (typeof name == 'object') {
      var obj = name
      Object.keys(obj).forEach(function(name) {
        var a = obj[name]
        self.link(name, a)
      })
      return
    }

    if (this._json.networks[this.network_id] == null) {
      this._json.networks[this.network_id] = {
        events: {},
        links: {},
      }
    }

    this.network.links[name] = address
  }

  // Note, this function can be called with two input types:
  // 1. Object with a bunch of data; this data will be merged with the json data of contract being cloned.
  // 2. network id; this will clone the contract and set a specific network id upon cloning.
  static clone(json) {
    var self = this

    json = json || {}

    // var temp = function TruffleContract() {
    //   this.constructor = temp
    //   return Contract.apply(this, arguments)
    // }

    const temp = TruffleContract

    temp.prototype = Object.create(self.prototype)

    var network_id

    // If we have a network id passed
    if (typeof json != 'object') {
      network_id = json
      json = self._json
    }

    json = Utils.merge({}, self._json || {}, json)

    temp._static_methods = this._static_methods
    temp._properties = this._properties

    temp._property_values = {}
    temp._json = json

    Utils.bootstrap(temp)

    temp.web3 = new Web3()
    temp.class_defaults = temp.prototype.defaults || {}

    if (network_id) {
      temp.setNetwork(network_id)
    }

    // Copy over custom key/values to the contract class
    Object.keys(json).forEach(function(key) {
      if (key.indexOf('x-') != 0) return
      temp[key] = json[key]
    })

    return temp
  }

  static addProp(key, fn) {
    var self = this

    var getter = function() {
      if (fn.get != null) {
        return fn.get.call(self)
      }

      return self._property_values[key] || fn.call(self)
    }

    var setter = function(val) {
      if (fn.set != null) {
        fn.set.call(self, val)
        return
      }

      // If there's not a setter, then the property is immutable.
      throw new Error(key + ' property is immutable')
    }

    var definition = {
      enumerable: false,
      configurable: false,
      get: getter,
      set: setter,
    }

    Object.defineProperty(this, key, definition)
  }

  static toJSON() {
    return this._json
  }
}

export default Contract
