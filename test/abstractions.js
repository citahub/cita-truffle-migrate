const assert = require('chai').assert
const Schema = require('truffle-contract-schema')
const contract = require('../dist/contract')
const temp = require('temp').track()
const path = require('path')
const solc = require('solc')
const fs = require('fs')
const util = require('./util')
const log = require('../dist/utils/log').title('test/abstractions')
const config = require('./config')
const { currentValidUntilBlock } = require('../dist/utils/appchain')

describe('Abstractions', function() {
  let Example
  let web3

  this.timeout(20000)

  before(function(done) {
    this.timeout(20000)

    // Compile first
    var result = solc.compile(fs.readFileSync('./test/lib/Example.sol', { encoding: 'utf8' }), 1)

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

  it('should get and set values via methods and get values via .call or .send', function(done) {
    const txParams = {
      ...config.txParams,
    }
    let example
    this.timeout(30000)
    Example.new(1, txParams)
      .then((instance) => {
        example = instance
        txParams.from = example.address
        return example.methods.value().call()
      })
      .then((value) => {
        assert.equal(value.valueOf(), 1, 'Starting value should be 1')
      })
      .then(() => {
        return currentValidUntilBlock(web3)
      })
      .then((validUntilBlock) => {
        txParams.validUntilBlock = validUntilBlock
        return example.methods.setValue(5).send(txParams)
      })
      .then((res) => {
        return web3.listeners.listenToTransactionReceipt(res.hash)
      })
      .then((res) => {
        return example.methods.value().call()
      })
      .then((value) => {
        assert.equal(value.valueOf(), 5, 'Ending value should be five')
      })
      .then(done)
      .catch(done)
  })

  it("shouldn't synchronize constant functions", function(done) {
    var example
    const txParams = {
      ...config.txParams,
    }
    Example.new(5, txParams)
      .then((instance) => {
        example = instance
        return example.methods.getValue().call()
      })
      .then((value) => {
        assert.equal(value.valueOf(), 5, 'Value should have been retrieved with explicitly calling .call()')
      })
      .then(done)
      .catch(done)
  })

  // it('should allow BigNumbers as input parameters, and not confuse them as transaction objects', function(done) {
  //   // BigNumber passed on new()
  //   var example = null
  //   const txParams = {
  //     ...config.txParams,
  //   }
  //   Example.new(web3.utils.toBN(30), txParams)
  //     .then((instance) => {
  //       example = instance
  //       txParams.from = example.address
  //       return example.methods.value().call()
  //     })
  //     .then((value) => {
  //       assert.equal(value.valueOf(), 30, 'Starting value should be 30')
  //     })
  //     .then(() => {
  //       return currentValidUntilBlock(web3)
  //     })
  //     .then((validUntilBlock) => {
  //       txParams.validUntilBlock = validUntilBlock
  //       // BigNumber passed in a transaction.
  //       return example.methods.setValue(web3.utils.toBN(25)).send(txParams)
  //     })
  //     .then((res) => {
  //       return web3.listeners.listenToTransactionReceipt(res.hash)
  //     })
  //     .then((res) => {
  //       return example.methods.value().call()
  //     })
  //     .then((value) => {
  //       assert.equal(value.valueOf(), 25, 'Ending value should be twenty-five')
  //       // BigNumber passed in a call.
  //       return example.methods.parrot(865).call()
  //     })
  //     .then((parrot_value) => {
  //       assert.equal(parrot_value.valueOf(), 865, 'Parrotted value should equal 865')
  //     })
  //     .then(done)
  //     .catch(done)
  // })
})
