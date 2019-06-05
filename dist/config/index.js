const fs = require('fs')
const _ = require('lodash')
const path = require('path')
const Provider = require('truffle-provider')
const TruffleError = require('truffle-error')
const Module = require('module')
const findUp = require('find-up')
const originalrequire = require('original-require')

const DEFAULT_CONFIG_FILENAME = 'truffle.js'
const BACKUP_CONFIG_FILENAME = 'truffle-config.js' // For Windows + Command Prompt

function Config(truffle_directory, working_directory, network) {
  const self = this

  const default_tx_values = {
    from: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    nonce: 99,
    quota: 9999999,
    version: 2,
    validUntilBlock: undefined,
    value: '0x0',
  }

  this._values = {
    truffle_directory: truffle_directory || path.resolve(path.join(__dirname, '../')),
    working_directory: working_directory || process.cwd(),
    network: network,
    networks: {},
    verboseRpc: false,
    gas: null,
    gasPrice: null,
    from: null,
    nonce: null,
    quota: null,
    version: null,
    validUntilBlock: null,
    build: null,
    resolver: null,
    artifactor: null,
    ethpm: {
      ipfs_host: 'ipfs.infura.io',
      ipfs_protocol: 'https',
      registry: '0x8011df4830b4f696cd81393997e5371b93338878',
      install_provider_uri: 'https://ropsten.infura.io/truffle',
    },
    solc: {
      optimizer: {
        enabled: false,
        runs: 200,
      },
      evmVersion: 'byzantium',
    },
    logger: {
      log: function() {},
    },
  }

  const props = {
    // These are already set.
    truffle_directory: function() {},
    working_directory: function() {},
    network: function() {},
    networks: function() {},
    verboseRpc: function() {},
    build: function() {},
    resolver: function() {},
    artifactor: function() {},
    ethpm: function() {},
    solc: function() {},
    logger: function() {},

    build_directory: function() {
      return path.join(self.working_directory, 'build')
    },
    contracts_directory: function() {
      return path.join(self.working_directory, 'contracts')
    },
    contracts_build_directory: function() {
      return path.join(self.build_directory, 'contracts')
    },
    migrations_directory: function() {
      return path.join(self.working_directory, 'migrations')
    },
    test_directory: function() {
      return path.join(self.working_directory, 'test')
    },
    test_file_extension_regexp: function() {
      return /.*\.(js|es|es6|jsx|sol)$/
    },
    example_project_directory: function() {
      return path.join(self.truffle_directory, 'example')
    },
    network_id: {
      get: function() {
        try {
          return self.network_config.network_id
        } catch (e) {
          return null
        }
      },
      set: function(val) {
        throw new Error(
          'Do not set config.network_id. Instead, set config.networks and then config.networks[<network name>].network_id'
        )
      },
    },
    network_config: {
      get: function() {
        var network = self.network

        if (network == null) {
          throw new Error('Network not set. Cannot determine network to use.')
        }

        var conf = self.networks[network]

        if (conf == null) {
          config = {}
        }

        conf = _.extend({}, default_tx_values, conf)

        return conf
      },
      set: function(val) {
        throw new Error("Don't set config.network_config. Instead, set config.networks with the desired values.")
      },
    },
    from: {
      get: function() {
        try {
          return self.network_config.from
        } catch (e) {
          return default_tx_values.from
        }
      },
      set: function(val) {
        throw new Error(
          "Don't set config.from directly. Instead, set config.networks and then config.networks[<network name>].from"
        )
      },
    },
    nonce: {
      get: function() {
        try {
          return self.network_config.nonce
        } catch (e) {
          return default_tx_values.nonce
        }
      },
      set: function(val) {
        throw new Error(
          "Don't set config.nonce directly. Instead, set config.networks and then config.networks[<network name>].nonce"
        )
      },
    },
    quota: {
      get: function() {
        try {
          return self.network_config.quota
        } catch (e) {
          return default_tx_values.quota
        }
      },
      set: function(val) {
        throw new Error(
          "Don't set config.quota directly. Instead, set config.networks and then config.networks[<network name>].quota"
        )
      },
    },
    version: {
      get: function() {
        try {
          return self.network_config.version
        } catch (e) {
          return default_tx_values.version
        }
      },
      set: function(val) {
        throw new Error(
          "Don't set config.version directly. Instead, set config.networks and then config.networks[<network name>].version"
        )
      },
    },
    // chainId: {
    //   get: function() {
    //     try {
    //       return self.network_config.chainId
    //     } catch (e) {
    //       throw new Error('You must set chainId')
    //       // return default_tx_values.chainId
    //     }
    //   },
    //   set: function(val) {
    //     throw new Error(
    //       "Don't set config.chainId directly. Instead, set config.networks and then config.networks[<network name>].chainId"
    //     )
    //   },
    // },
    privateKey: {
      get: function() {
        try {
          return self.network_config.privateKey
        } catch (e) {
          throw new Error('You must set privateKey')
          // return default_tx_values.privateKey
        }
      },
      set: function(val) {
        throw new Error(
          "Don't set config.privateKey directly. Instead, set config.networks and then config.networks[<network name>].privateKey"
        )
      },
    },
    validUntilBlock: {
      get: function() {
        try {
          return self.network_config.validUntilBlock
        } catch (e) {
          return default_tx_values.validUntilBlock
        }
      },
      set: function(val) {
        throw new Error(
          "Don't set config.validUntilBlock directly. Instead, set config.networks and then config.networks[<network name>].validUntilBlock"
        )
      },
    },
    value: {
      get: function() {
        try {
          return self.network_config.value
        } catch (e) {
          throw new Error('You must set chainId')
          // return default_tx_values.value
        }
      },
      set: function(val) {
        throw new Error(
          "Don't set config.value directly. Instead, set config.networks and then config.networks[<network name>].value"
        )
      },
    },
    gas: {
      get: function() {
        try {
          return self.network_config.gas
        } catch (e) {
          return default_tx_values.gas
        }
      },
      set: function(val) {
        throw new Error(
          "Don't set config.gas directly. Instead, set config.networks and then config.networks[<network name>].gas"
        )
      },
    },
    gasPrice: {
      get: function() {
        try {
          return self.network_config.gasPrice
        } catch (e) {
          return default_tx_values.gasPrice
        }
      },
      set: function(val) {
        throw new Error(
          "Don't set config.gasPrice directly. Instead, set config.networks and then config.networks[<network name>].gasPrice"
        )
      },
    },
    provider: {
      get: function() {
        if (!self.network) {
          return null
        }

        var options = self.network_config
        options.verboseRpc = self.verboseRpc
        return Provider.create(options)
      },
      set: function(val) {
        throw new Error(
          "Don't set config.provider directly. Instead, set config.networks and then set config.networks[<network name>].provider"
        )
      },
    },
  }

  Object.keys(props).forEach(function(prop) {
    self.addProp(prop, props[prop])
  })
}

Config.prototype.addProp = function(key, obj) {
  Object.defineProperty(this, key, {
    get:
      obj.get ||
      function() {
        return this._values[key] || obj()
      },
    set:
      obj.set ||
      function(val) {
        this._values[key] = val
      },
    configurable: true,
    enumerable: true,
  })
}

Config.prototype.normalize = function(obj) {
  var clone = {}
  Object.keys(obj).forEach(function(key) {
    try {
      clone[key] = obj[key]
    } catch (e) {
      // Do nothing with values that throw.
    }
  })
  return clone
}

Config.prototype.with = function(obj) {
  var normalized = this.normalize(obj)
  var current = this.normalize(this)

  return _.extend({}, current, normalized)
}

Config.prototype.merge = function(obj) {
  var self = this
  var clone = this.normalize(obj)

  // Only set keys for values that don't throw.
  Object.keys(obj).forEach(function(key) {
    try {
      self[key] = clone[key]
    } catch (e) {
      // Do nothing.
    }
  })

  return this
}

Config.default = function() {
  return new Config()
}

Config.detect = function(options, filename) {
  var search

  !filename ? (search = [DEFAULT_CONFIG_FILENAME, BACKUP_CONFIG_FILENAME]) : (search = filename)

  var file = findUp.sync(search, { cwd: options.working_directory || options.workingDirectory })

  if (file == null) {
    throw new TruffleError('Could not find suitable configuration file.')
  }

  return this.load(file, options)
}

Config.load = function(file, options) {
  var config = new Config()

  config.working_directory = path.dirname(path.resolve(file))

  // The require-nocache module used to do this for us, but
  // it doesn't bundle very well. So we've pulled it out ourselves.
  delete require.cache[Module._resolveFilename(file, module)]
  var static_config = originalrequire(file)

  config.merge(static_config)
  config.merge(options)

  return config
}

module.exports = Config
