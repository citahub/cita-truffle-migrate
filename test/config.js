const AppChain = require('@appchain/base').default
const Web3 = require('web3')
const { addressFromPrivateKey } = require('../dist/utils/appchain')

const creater = () => {
  const privateKey = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
  const host = '121.196.200.225'
  const port = '1337'
  const verboseRpc = undefined
  const quota = 3141592

  const options = {
    host: host,
    port: port,
    verboseRpc: verboseRpc,
  }

  const txParams = { quota, privateKey }

  const config = {
    privateKey,
    host,
    port,
    options,
    txParams,
  }
  return config
}

const config = creater()

module.exports = config
