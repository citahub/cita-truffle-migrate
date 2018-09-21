var Nervos = require('@nervos/chain').default
var log = require('../utils/log').title('contract/contract')
const {
  currentValidUntilBlock,
  deployContract,
  pollingReceipt,
  storeAbiCheck,
  fetchedChainId,
} = require('../utils/nervosutils')
const Utils = require('./utils')

// Planned for future features, logging, etc.
function Provider(provider) {
  this.provider = provider
}

Provider.prototype.send = function() {
  return this.provider.send.apply(this.provider, arguments)
}

Provider.prototype.sendAsync = function() {
  return this.provider.sendAsync.apply(this.provider, arguments)
}

// Accepts a contract object created with web3.eth.contract.
// Optionally, if called without `new`, accepts a network_id and will
// create a new version of the contract abstraction with that network_id set.
const Contract = function(contract) {
  var self = this
  var constructor = this.constructor
  this.abi = constructor.abi

  if (typeof contract == 'string') {
    var address = contract
    var contract = new constructor.web3.appchain.Contract(this.abi, address)
    contract.address = address
    // contract = contract_class.at(address)
  }

  // Object.assign(contract, contract.methods)
  // Object.assign(contract, contract.events)

  this.contract = contract

  // TODO: 我用的是 nervos, 所以不需要考虑 promisify
  // TODO: 取消需要调用 call 和 send
  this.methods = contract.methods
  this.events = contract.events
  // Provision our functions.
  // for (var i = 0; i < this.abi.length; i++) {
  //   var item = this.abi[i]
  //   log(i, item.name)

  //   // if (item.type == 'function') {
  //   //   if (item.constant == true) {
  //   //     this[item.name] = Utils.promisifyFunction(contract[item.name], constructor)
  //   //   } else {
  //   //     this[item.name] = Utils.synchronizeFunction(contract[item.name], this, constructor)
  //   //   }

  //   //   this[item.name].call = Utils.promisifyFunction(contract[item.name].call, constructor)
  //   //   this[item.name].sendTransaction = Utils.promisifyFunction(contract[item.name].sendTransaction, constructor)
  //   //   this[item.name].request = contract[item.name].request
  //   //   this[item.name].estimateGas = Utils.promisifyFunction(contract[item.name].estimateGas, constructor)
  //   // }

  //   // if (item.type == 'event') {
  //   //   this[item.name] = contract[item.name]
  //   // }
  // }

  // this.sendTransaction = Utils.synchronizeFunction(
  //   function(tx_params, callback) {
  //     if (typeof tx_params == 'function') {
  //       callback = tx_params
  //       tx_params = {}
  //     }

  //     tx_params.to = self.address

  //     constructor.web3.appchain.sendTransaction.apply(constructor.web3.appchain, [tx_params, callback])
  //   },
  //   this,
  //   constructor
  // )

  this.sendTransaction = (tx_params) => {
    return constructor.web3.appchain.sendTransaction.apply(constructor.web3.appchain, [tx_params])
  }

  this.send = function(value) {
    return self.sendTransaction({ value: value })
  }

  this.allEvents = contract.allEvents
  this.address = contract.address
  this.transactionHash = contract.transactionHash
}

const setProvider = function(provider) {
  if (!provider) {
    throw new Error('Invalid provider passed to setProvider(); provider is ' + provider)
  }
  var wrapped = new Provider(provider)
  this.web3.setProvider(wrapped)
  this.currentProvider = provider
}

const newContract = function(...args) {
  const self = this
  checkCurrentProvider(self)
  checkBytecode(self)

  return self
    .detectNetwork()
    .then(function(network_id) {
      // After the network is set,
      // check to make sure everything's ship shape.
      checkLibraries(self)
    })
    .then(function() {
      return deploy(self, args)
    })
}

const at = function(address) {
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

const deployed = function() {
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

const defaults = function(class_defaults) {
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

const hasNetwork = function(network_id) {
  return this._json.networks[network_id + ''] != null
}

const isDeployed = function() {
  if (this.network_id == null) {
    return false
  }

  if (this._json.networks[this.network_id] == null) {
    return false
  }

  return !!this.network.address
}

const detectNetwork = function() {
  var self = this

  return new Promise(function(accept, reject) {
    // Try to detect the network we have artifacts for.
    if (self.network_id) {
      // We have a network id and a configuration, let's go with it.
      if (self.networks[self.network_id] != null) {
        accept(self.network_id)
      }
    }
    // 将 chain id 作为 network id
    fetchedChainId(self.web3)
      .then((chainId) => {
        const network_id = 'appchain' + chainId.toString()
        self.setNetwork(network_id)
        accept(network_id)
      })
      .catch((err) => {
        reject(err)
      })
  })
}

const setNetwork = function(network_id) {
  if (!network_id) return
  this.network_id = network_id + ''
}

// Overrides the deployed address to null.
// You must call this explicitly so you don't inadvertently do this otherwise.
const resetAddress = function() {
  delete this.network.address
}

const link = function(name, address) {
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
  } else if (typeof name == 'object') {
    log('typeof name == object', 'name:', name, 'address', address)
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
const clone = function(json) {
  var self = this

  json = json || {}

  var ContractClone = function TruffleContract() {
    this.constructor = ContractClone
    return Contract.apply(this, arguments)
  }

  ContractClone.prototype = Object.create(self.prototype)

  var network_id

  // If we have a network id passed
  if (typeof json != 'object') {
    network_id = json
    json = self._json
  }

  json = Utils.merge({}, self._json || {}, json)

  ContractClone._static_methods = this._static_methods
  ContractClone._properties = this._properties

  ContractClone._property_values = {}
  ContractClone._json = json

  Utils.addClassMethodsAndProperties(ContractClone)

  // ContractClone.web3 = new Web3()
  ContractClone.web3 = Nervos()
  ContractClone.class_defaults = ContractClone.prototype.defaults || {}

  if (network_id) {
    ContractClone.setNetwork(network_id)
  }

  // Copy over custom key/values to the contract class
  Object.keys(json).forEach(function(key) {
    if (key.indexOf('x-') != 0) return
    ContractClone[key] = json[key]
  })
  return ContractClone
}

const addProp = function(key, fn) {
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

  var definition = {}
  definition.enumerable = false
  definition.configurable = false
  definition.get = getter
  definition.set = setter

  Object.defineProperty(this, key, definition)
}

const toJSON = function() {
  return this._json
}

const formatLibraries = function(unlinkedLibraries) {
  const unlinked = unlinkedLibraries
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
  return unlinked
}

const findUnlinkedLibraries = function(contract, unlinkedLibraries) {
  const unlinked = formatLibraries(unlinkedLibraries)
  throw new Error(
    self.contractName +
      ' contains unresolved libraries. You must deploy and link the following libraries before you can deploy a new version of ' +
      self._json.contractName +
      ': ' +
      unlinked
  )
}

const checkLibraries = function(contract) {
  var regex = /__[^_]+_+/g
  var unlinkedLibraries = contract.binary.match(regex)
  if (unlinkedLibraries != null) {
    findUnlinkedLibraries(contract, unlinkedLibraries)
  }
}

const checkCurrentProvider = function(contract) {
  if (contract.currentProvider == null) {
    throw new Error(contract.contractName + ' error: Please call setProvider() first before calling new().')
  }
}

const checkBytecode = function(contract) {
  if (!contract.bytecode) {
    throw new Error(contract._json.contractName + " error: contract binary not set. Can't deploy new instance.")
  }
}

const parsedDeployContractParams = function(contract, args) {
  var tx_params = {}
  var last_arg = args[args.length - 1]

  // It's only tx_params if it's an object and not a BigNumber.
  if (Utils.is_object(last_arg) && !Utils.is_big_number(last_arg)) {
    tx_params = args.pop()
  }

  // Validate constructor args
  var constructor = contract.abi.filter(function(item) {
    return item.type === 'constructor'
  })

  if (constructor.length && constructor[0].inputs.length !== args.length) {
    throw new Error(
      contract.contractName +
        ' contract constructor expected ' +
        constructor[0].inputs.length +
        ' arguments, received ' +
        args.length
    )
  }

  tx_params = Utils.merge(contract.class_defaults, tx_params)

  if (tx_params.data == null) {
    tx_params.data = contract.binary
  }
  tx_params.chainId = contract.network_id.split('appchain')[1]

  return { tx_params, args }
}

const deploy = function(TruffleContract, inputArgs) {
  const self = TruffleContract
  let { tx_params, args } = parsedDeployContractParams(self, inputArgs)
  var contract = new self.web3.appchain.Contract(self.abi)
  // TODO: 这里需要手动加上, 需要修复
  contract._requestManager.provider = self.web3.currentProvider

  return (
    deployContract(self.web3, contract, self.bytecode, args, tx_params)
      .then((res) => {
        console.log('transaction hash of deploy contract: ', res.hash)
        return pollingReceipt(self.web3, res.hash)
      })
      .then((res) => {
        if (res.errorMessage !== null) {
          throw new Error(`deployContract error:\n ${res.errorMessage}`)
        }
        contract.transactionHash = res.transactionHash
        contract.address = res.contractAddress
        contract.options.address = res.contractAddress
      })
      // TODO: abi truffle 已经存了, 所以这里不用存到链上(待定)
      // .then(() => {
      //   const success = `${self.contract_name} store abi success`
      //   const failure = `${self.contract_name} store abi failure`
      //   return storeAbiCheck(self.web3, contract.address, self.abi, tx_params, success, failure)
      // })
      .then(() => {
        const instance = new self(contract)
        return instance
      })
      .catch((err) => {
        console.error('deploy error :', err)
        return err
      })
  )
}

Contract._static_methods = {
  setProvider,
  new: newContract,
  at,
  deployed,
  defaults,
  hasNetwork,
  isDeployed,
  detectNetwork,
  setNetwork,
  resetAddress,
  link,
  clone,
  addProp,
  toJSON,
}

// Getter functions are scoped to Contract object.
Contract._properties = {
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
    // var web3 = new Web3()
    var web3 = Nervos()

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

      var topic = web3.utils.sha3(signature)

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

Utils.addClassMethodsAndProperties(Contract)

module.exports = Contract
