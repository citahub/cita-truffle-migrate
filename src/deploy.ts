import log from './log'
import { fromUtf8 } from './contract_utils'

const pollingTransationReceipt = async (web3, hash) => {
  let i = 0
  let res = null
  while (i < 10) {
    res = await web3.appchain.getTransactionReceipt(hash)
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve()
      }, 1000)
    })
    i += 1
    log('获取交易收据次数', i)
    if (res) {
      log('轮询结果', res)
      const err = res.errorMessage
      if (err === null) {
        console.log('store abi successful')
      } else {
        console.error(err)
      }
      return
    }
  }
  console.error('fetch transaction receipt overtime')
}

const storeAbiToBlockchain = async (contractInfo, web3, address) => {
  const { abi, validUntilBlock, chainId, nonce, value, version, quota, privateKey } = contractInfo
  let abibytes = fromUtf8(JSON.stringify(abi))
  const data = address + abibytes
  const tx = {
    to: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    quota,
    version,
    value,
    nonce,
    data,
    validUntilBlock,
    chainId,
    privateKey,
  }
  let res = await web3.eth.sendTransaction(tx)
  const hash = res.result.hash
  log('交易哈希', hash)
  res = pollingTransationReceipt(web3, hash)
}

const deployContract = async (contractInfo, web3) => {
  const { bytecode, privateKey, from, nonce, quota, value, chainId, version } = contractInfo
  const params = { privateKey, from, nonce, quota, value, chainId, version }
  let res
  res = await web3.cita.deploy(bytecode, params)
  const errDeploy = res.result.errorMessage
  if (errDeploy) {
    throw errDeploy
  }
  log('deploy ', res)
  const address = res.result.contractAddress
  console.log('contract deployed successful, address:', address)
  await storeAbiToBlockchain(contractInfo, web3, address)
  log('store abi 是异步的么?')
  return address
}

const deploy = async (contractInfo, web3) => {
  const { validUntilBlock } = contractInfo
  if (validUntilBlock === undefined) {
    const res = await web3.eth.getBlockNumber()
    const num = Number(res.result)
    contractInfo.validUntilBlock = +num + 88
  }
  await deployContract(contractInfo, web3)
}

export default deploy
