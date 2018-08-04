import log from '../utils/log'
import { fromUtf8 } from '../utils/contract_utils'

const assertAbiIsStored = async (receipt, web3, address) => {
  let err
  err = receipt.errorMessage
  if (err === null) {
    const abi = await web3.appchain.getAbi(address)
    if (abi === '0x') {
      err = 'store abi failure'
    } else {
      console.log('store abi success')
      return
    }
  }
  throw err
}

const pollingReceipt = (web3, hash) => {
  let remain = 10
  const p = new Promise((resolve, reject) => {
    let interval = setInterval(async () => {
      remain = remain - 1
      const receipt = await web3.appchain.getTransactionReceipt(hash)
      if (receipt) {
        clearInterval(interval)
        resolve(receipt)
      } else if (remain < 0) {
        reject('fetch transaction receipt overtime')
      }
    }, 1000)
  })
  return p
}

const storeAbiToBlockchain = async (contractInfo, web3, address) => {
  console.log('store abi ...')
  const { abi, validUntilBlock, chainId, nonce, value, version, quota, privateKey, from, to } = contractInfo
  let abibytes = fromUtf8(JSON.stringify(abi))
  const data = address + abibytes
  const tx = {
    from,
    to,
    quota,
    version,
    value,
    nonce,
    data,
    validUntilBlock,
    chainId,
    privateKey,
  }
  let res
  try {
    res = await web3.appchain.sendTransaction(tx).catch(console.error)
    const receipt = await pollingReceipt(web3, res.hash)
    await assertAbiIsStored(receipt, web3, address)
  } catch (err) {
    console.error(err)
  }
}

const deployContract = async (contractInfo, web3, artifact, args) => {
  console.log('deploy contract ...')
  const { bytecode, privateKey, from, nonce, quota, value, chainId, version, validUntilBlock } = contractInfo
  const tx = { privateKey, from, nonce, quota, value, chainId, version, validUntilBlock }
  const params = { data: bytecode, arguments: args }

  const { abi } = contractInfo
  const contract = new web3.appchain.Contract(abi)
  const info = await contract.deploy(params).send(tx)
  const receipt: any = await pollingReceipt(web3, info.hash)
  const { errorMessage: err, contractAddress: address } = receipt
  contract.options.address = address
  if (err !== null) {
    throw err
  }
  artifact.address = address
  console.log('contract deployed successful, address:', address)
  await storeAbiToBlockchain(contractInfo, web3, address)
  return Promise.resolve(contract)
}

const deploy = async (contractInfo, web3, artifact, args) => {
  const { validUntilBlock } = contractInfo

  if (validUntilBlock === undefined) {
    const res = await web3.appchain.getBlockNumber()
    const num = Number(res)
    contractInfo.validUntilBlock = num + 88
  }
  return await deployContract(contractInfo, web3, artifact, args)
}

export default deploy
