import log from './log'
import { fromUtf8 } from './contract_utils'

const assertAbiIsStored = async (receipt, web3, address) => {
  let err
  err = receipt.errorMessage
  if (err === null) {
    let abi = await web3.appchain.getAbi(address)
    if (abi === '0x') {
      err = 'store abi failure'
    } else {
      log('get abi receipt', abi)
      console.log('store abi success')
      return
    }
  }
  throw err
}

const pollingTransationReceipt = async (address, web3, hash) => {
  let i = 0
  let receipt = null
  while (i < 10) {
    receipt = await web3.appchain.getTransactionReceipt(hash)
    if (receipt) {
      log('轮询结果', receipt)
      try {
        await assertAbiIsStored(receipt, web3, address)
      } catch (err) {
        console.error(err)
      }
      return
    }
    await new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve()
      }, 1000)
    })
    i += 1
    log('获取交易收据次数', i)
  }
  console.error('fetch transaction receipt overtime')
}

const storeAbiToBlockchain = async (contractInfo, web3, address) => {
  const { abi, validUntilBlock, chainId, nonce, value, version, quota, privateKey } = contractInfo
  let abibytes = fromUtf8(JSON.stringify(abi))
  const data = address + abibytes
  const tx = {
    from: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    // to: '0xffffffffffffffffffffffffffffffffff010001',
    to: 'ffffffffffffffffffffffffffffffffff010001',
    quota,
    version,
    value,
    nonce,
    data,
    validUntilBlock,
    chainId,
    privateKey,
  }
  log('store abi tx', tx)
  let res
  try {
    res = await web3.appchain.sendTransaction(tx).catch(console.error)
    log('web3.appchain.sendTransaction res', res)
    const hash = res.hash
    log('交易哈希', hash)
    res = pollingTransationReceipt(address, web3, hash)
  } catch (err) {
    console.error(err)
  }
}

const deployContract = async (contractInfo, web3) => {
  log('deployContract')
  const { bytecode, privateKey, from, nonce, quota, value, chainId, version } = contractInfo
  const params = { privateKey, from, nonce, quota, value, chainId, version }
  let res
  res = await web3.appchain.deploy(bytecode, params)
  log('web3.appchain.deploy res ', res)
  const errDeploy = res.errorMessage
  if (errDeploy) {
    throw errDeploy
  }
  const address = res.contractAddress
  console.log('contract deployed successful, address:', address)
  await storeAbiToBlockchain(contractInfo, web3, address)
  return address
}

const deploy = async (contractInfo, web3) => {
  log('start deploy')
  const { validUntilBlock } = contractInfo
  if (validUntilBlock === undefined) {
    const res = await web3.appchain.getBlockNumber()
    const num = Number(res)
    log('num', contractInfo.validUntilBlock)
    contractInfo.validUntilBlock = +num + 88
    log('validUntilBlock', contractInfo.validUntilBlock)
  }
  await deployContract(contractInfo, web3)
}

export default deploy
