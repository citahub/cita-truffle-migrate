const fs = require('fs')
const dir = require('node-dir')
const path = require('path')
const ResolverIntercept = require('./resolverintercept')
const Require = require('truffle-require')
const async = require('async')
const AppChain = require('@appchain/base').default
const expect = require('truffle-expect')
const Deployer = require('truffle-deployer')
const log = require('../utils/log').title('migrate/index')
const { addressFromPrivateKey } = require('../utils/appchain')

function Migration(file) {
  this.file = path.resolve(file)
  this.number = parseInt(path.basename(file))
}

Migration.prototype.run = function(options, callback) {
  const self = this
  const logger = options.logger

  const appchain = AppChain(options.provider)
  appchain.setProvider(options.provider)

  logger.log('Running migration: ' + path.relative(options.migrations_directory, this.file))

  const resolver = new ResolverIntercept(options.resolver)

  // Initial context.
  const context = {
    appchain: appchain,
  }

  const deployer = new Deployer({
    logger: {
      log: function(msg) {
        logger.log('  ' + msg)
      },
    },
    network: options.network,
    network_id: options.networks[options.network].network_id,
    provider: options.provider,
    basePath: path.dirname(this.file),
  })

  const finish = function(err) {
    if (err) return callback(err)
    deployer
      .start()
      .then(function() {
        if (options.save === false) return
        logger.log('Saving artifacts...')
        return options.artifactor.saveAll(resolver.contracts())
      })
      .then(function() {
        // Use process.nextTicK() to prevent errors thrown in the callback from triggering the below catch()
        process.nextTick(callback)
      })
      .catch(function(e) {
        logger.log('Error encountered, bailing. Network state unknown. Review successful transactions manually.')
        callback(e)
      })
  }

  const address = addressFromPrivateKey(options.privateKey)
  const accounts = [address]

  Require.file(
    {
      file: self.file,
      context: context,
      resolver: resolver,
      args: [deployer],
    },
    function(err, fn) {
      if (!fn || !fn.length || fn.length == 0) {
        return callback(new Error('Migration ' + self.file + ' invalid or does not take any parameters'))
      }
      fn(deployer, options.network, accounts)
      finish()
    }
  )
}

var Migrate = {
  Migration: Migration,

  assemble: function(options, callback) {
    dir.files(options.migrations_directory, function(err, files) {
      if (err) return callback(err)

      options.allowed_extensions = options.allowed_extensions || /^\.(js|es6?)$/

      var migrations = files
        .filter(function(file) {
          return isNaN(parseInt(path.basename(file))) == false
        })
        .filter(function(file) {
          return path.extname(file).match(options.allowed_extensions) != null
        })
        .map(function(file) {
          return new Migration(file, options.network)
        })

      // Make sure to sort the prefixes as numbers and not strings.
      migrations = migrations.sort(function(a, b) {
        if (a.number > b.number) {
          return 1
        } else if (a.number < b.number) {
          return -1
        }
        return 0
      })

      callback(null, migrations)
    })
  },

  run: function(options, callback) {
    var self = this

    expect.options(options, [
      'working_directory',
      'migrations_directory',
      'contracts_build_directory',
      'provider',
      'artifactor',
      'resolver',
      'network',
      'network_id',
      'logger',
      'from', // address doing deployment
    ])

    if (options.reset == true) {
      return this.runAll(options, callback)
    }

    self.lastCompletedMigration(options, function(err, last_migration) {
      if (err) return callback(err)

      // Don't rerun the last completed migration.
      self.runFrom(last_migration + 1, options, callback)
    })
  },

  runFrom: function(number, options, callback) {
    var self = this

    this.assemble(options, function(err, migrations) {
      if (err) return callback(err)

      while (migrations.length > 0) {
        if (migrations[0].number >= number) {
          break
        }

        migrations.shift()
      }

      if (options.to) {
        migrations = migrations.filter(function(migration) {
          return migration.number <= options.to
        })
      }

      self.runMigrations(migrations, options, callback)
    })
  },

  runAll: function(options, callback) {
    this.runFrom(0, options, callback)
  },

  runMigrations: function(migrations, options, callback) {
    // Perform a shallow clone of the options object
    // so that we can override the provider option without
    // changing the original options object passed in.
    var clone = {}

    Object.keys(options).forEach(function(key) {
      clone[key] = options[key]
    })

    if (options.quiet) {
      clone.logger = {
        log: function() {},
      }
    }

    clone.provider = this.wrapProvider(options.provider, clone.logger)
    clone.resolver = this.wrapResolver(options.resolver, clone.provider)
    // fix inner promise always pending in last migration
    migrations.push(null)
    async.eachSeries(
      migrations,
      function(migration, finished) {
        if (migration === null) return
        migration.run(clone, function(err) {
          if (err) return finished(err)
          finished()
        })
      },
      callback
    )
  },

  wrapProvider: function(provider, logger) {
    var printTransaction = function(tx_hash) {
      logger.log('  ... ' + tx_hash)
    }

    return {
      send: function(payload) {
        var result = provider.send(payload)

        if (payload.method == 'eth_sendTransaction') {
          printTransaction(result.result)
        }

        return result
      },
      sendAsync: function(payload, callback) {
        provider.sendAsync(payload, function(err, result) {
          if (err) return callback(err)

          if (payload.method == 'eth_sendTransaction') {
            printTransaction(result.result)
          }

          callback(err, result)
        })
      },
    }
  },

  wrapResolver: function(resolver, provider) {
    return {
      require: function(import_path, search_path) {
        var abstraction = resolver.require(import_path, search_path)

        abstraction.setProvider(provider)

        return abstraction
      },
      resolve: resolver.resolve,
    }
  },

  lastCompletedMigration: function(options, callback) {
    var Migrations

    try {
      Migrations = options.resolver.require('Migrations')
    } catch (e) {
      return callback(new Error('Could not find built Migrations contract: ' + e.message))
    }

    if (Migrations.isDeployed() == false) {
      return callback(null, 0)
    }

    var migrations = Migrations.deployed()

    Migrations.deployed()
      .then(function(migrations) {
        // Two possible Migrations.sol's (lintable/unlintable)
        return migrations.last_completed_migration
          ? migrations.last_completed_migration.call()
          : migrations.lastCompletedMigration.call()
      })
      .then(function(completed_migration) {
        callback(null, completed_migration.toNumber())
      })
      .catch(callback)
  },

  needsMigrating: function(options, callback) {
    var self = this

    if (options.reset == true) {
      return callback(null, true)
    }

    this.lastCompletedMigration(options, function(err, number) {
      if (err) return callback(err)

      self.assemble(options, function(err, migrations) {
        if (err) return callback(err)

        while (migrations.length > 0) {
          if (migrations[0].number >= number) {
            break
          }

          migrations.shift()
        }

        callback(null, migrations.length > 1)
      })
    })
  },
}

module.exports = Migrate
