var assert = require('chai').assert
var Schema = require('truffle-contract-schema')
var contract = require('../dist/contract')
var temp = require('temp').track()
var path = require('path')
var solc = require('solc')
var fs = require('fs')
// var requireNoCache = require("require-nocache")(module);
var util = require('./util')
var log = require('../dist/utils/log').title('test/abstractions')
const config = require('./config')
const { currentValidUntilBlock } = require('../dist/utils/nervosutils')

describe('Abstractions', function() {
  var Example
  var accounts
  var abi
  var binary
  var network_id
  var web3

  this.timeout(20000)

  before(function(done) {
    this.timeout(10000)

    // Compile first
    var result = solc.compile(fs.readFileSync('./test/Example.sol', { encoding: 'utf8' }), 1)

    // Clean up after solidity. Only remove solidity's listener,
    // which happens to be the first.
    process.removeListener('uncaughtException', process.listeners('uncaughtException')[0])

    var contractObj, contractName
    if (result.contracts['Example']) {
      contractName = 'Example'
    } else {
      contractName = ':Example'
    }

    contractObj = result.contracts[contractName]
    contractObj.contractName = contractName
    Example = contract(contractObj)

    // save abi and binary for later
    abi = Example.abi
    binary = Example.bytecode
    util
      .setUpProvider(Example)
      .then(function(result) {
        web3 = result.web3
        accounts = result.accounts
        done()
      })
      .catch(done)
  })

  after(function(done) {
    temp.cleanupSync()
    done()
  })

  it('should set the transaction hash of contract instantiation', function() {
    const txParams = {
      ...config.txParams,
    }
    this.timeout(20000)
    return Example.new(1, txParams).then((example) => {
      assert(example.transactionHash, 'transactionHash should be non-empty')
    })
  })
})
