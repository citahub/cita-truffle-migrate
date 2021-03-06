const command = {
  command: 'migrate',
  description: 'Run migrations to deploy contracts',
  builder: {
    reset: {
      type: 'boolean',
      default: false,
    },
    'compile-all': {
      describe: 'recompile all contracts',
      type: 'boolean',
      default: false,
    },
    'dry-run': {
      describe: 'Run migrations against an in-memory fork, for testing',
      type: 'boolean',
      default: false,
    },
    f: {
      describe: 'Specify a migration number to run from',
      type: 'number',
    },
  },
  run: function(options, done) {
    const OS = require('os')
    const Config = require('../../config')
    const Contracts = require('../../workflow-compile')
    const Resolver = require('../../resolver')
    const Artifactor = require('truffle-artifactor')
    const Migrate = require('../../migrate')
    const Environment = require('../environment')
    const temp = require('temp')
    const copy = require('../copy')

    const config = Config.detect(options)

    function setupDryRunEnvironmentThenRunMigrations(callback) {
      Environment.fork(config, function(err) {
        if (err) return callback(err)

        // Copy artifacts to a temporary directory
        temp.mkdir('migrate-dry-run-', function(err, temporaryDirectory) {
          if (err) return callback(err)

          function cleanup() {
            const args = arguments
            // Ensure directory cleanup.
            temp.cleanup(function(err) {
              // Ignore cleanup errors.
              callback.apply(null, args)
            })
          }

          copy(config.contracts_build_directory, temporaryDirectory, function(err) {
            if (err) return callback(err)

            config.contracts_build_directory = temporaryDirectory

            // Note: Create a new artifactor and resolver with the updated config.
            // This is because the contracts_build_directory changed.
            // Ideally we could architect them to be reactive of the config changes.
            config.artifactor = new Artifactor(temporaryDirectory)
            config.resolver = new Resolver(config)

            runMigrations(cleanup)
          })
        })
      })
    }

    function runMigrations(callback) {
      if (options.f) {
        Migrate.runFrom(options.f, config, done)
      } else {
        Migrate.needsMigrating(config, function(err, needsMigrating) {
          if (err) return callback(err)

          if (needsMigrating) {
            Migrate.run(config, done)
          } else {
            config.logger.log('Network up to date.')
            callback()
          }
        })
      }
    }

    Contracts.compile(config, function(err) {
      if (err) return done(err)

      Environment.detect(config, function(err) {
        if (err) return done(err)

        const dryRun = options.dryRun === true

        const networkMessage = "Using network '" + config.network + "'"

        if (dryRun) {
          networkMessage += ' (dry run)'
        }

        config.logger.log(networkMessage + '.' + OS.EOL)
        if (dryRun) {
          setupDryRunEnvironmentThenRunMigrations(done)
        } else {
          runMigrations(done)
        }
      })
    })
  },
}

module.exports = command
