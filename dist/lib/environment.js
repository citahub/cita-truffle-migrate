const AppChain = require('@appchain/base').default
const TruffleError = require('truffle-error')
const expect = require('truffle-expect')
const Resolver = require('../resolver')
const Artifactor = require('truffle-artifactor')

const Environment = {
  // It's important config is a Config object and not a vanilla object
  detect: function(config, callback) {
    expect.options(config, ['networks'])

    if (!config.resolver) {
      config.resolver = new Resolver(config)
    }

    if (!config.artifactor) {
      config.artifactor = new Artifactor(config.contracts_build_directory)
    }

    if (!config.network && config.networks['development']) {
      config.network = 'development'
    }

    if (!config.network) {
      return callback(new Error('No network specified. Cannot determine current network.'))
    }

    var network_config = config.networks[config.network]

    if (!network_config) {
      return callback(
        new TruffleError(
          'Unknown network "' + config.network + '". See your Truffle configuration file for available networks.'
        )
      )
    }

    config.networks[config.network].network_id = config.networks[config.network].network_id || '*'

    callback()
  },

  // Ensure you call Environment.detect() first.
  fork: function(config, callback) {
    expect.options(config, ['from'])

    const appchain = AppChain(config.provider)

    appchain.eth.getAccounts(function(err, accounts) {
      if (err) return callback(err)

      const upstreamNetwork = config.network
      const upstreamConfig = config.networks[upstreamNetwork]
      const forkedNetwork = config.network + '-fork'

      config.networks[forkedNetwork] = {
        network_id: config.network_id,
        provider: TestRPC.provider({
          fork: config.provider,
          unlocked_accounts: accounts,
        }),
        from: config.from,
      }
      config.network = forkedNetwork

      callback()
    })
  },

  develop: function(config, testrpcOptions, callback) {
    var self = this

    expect.options(config, ['networks'])

    const network = config.network || 'develop'
    const url = `http://${testrpcOptions.host}:${testrpcOptions.port}/`

    config.networks[network] = {
      network_id: testrpcOptions.network_id,
      provider: function() {
        return new AppChain.providers.HttpProvider(url)
      },
    }

    config.network = network

    Environment.detect(config, callback)
  },
}

module.exports = Environment
