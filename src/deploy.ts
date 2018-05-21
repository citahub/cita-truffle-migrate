import log from './log'
import utils from './utils'
import * as Web3 from 'cita-web3'
import { initBlockNumber } from './contract_utils'

const storeAbiToBlockchain = async (contractInfo, web3, contract) => {
  const { address } = contract
  const { privkey, nonce, quota, bytecode, validUntilBlock, version, chainId, abi, to } = contractInfo

  let hex = utils.fromUtf8(JSON.stringify(abi))
  hex = hex.slice(0, 2) === '0x' ? hex : hex.slice(2)
  const code = (address.slice(0, 2) === '0x' ? address.slice(2) : address) + hex

  let con = await new Promise((resolve, reject) => {
    const data = code
    const params = { privkey, nonce, quota, validUntilBlock, version, to, data, chainId }
    // log('发送交易')
    web3.eth.sendTransaction({ ...params }, (err, res) => {
      if (err) {
        reject(err)
      } else {
        // // log(contract.address)
        resolve(contract)
      }
    })
  }).catch((err) => {
    console.error(err)
    return err
  })
  return con
}

const deployContract = async (contractInfo, web3, contract) => {
  const { privkey, nonce, quota, bytecode, validUntilBlock, version, chainId } = contractInfo
  let contrac = await new Promise((resolve, reject) => {
    const data = bytecode
    const params = { privkey, nonce, quota, validUntilBlock, version, data, chainId }
    // log('创建新的合约对象')
    contract.new({ ...params }, (err, contrac) => {
      // log('轮询获取合约地址')
      // log(contrac.address)
      for (let i = 0; i < 100; i++) {
          
      }
      if (err) {
        reject(err)
      } else if (contrac.address) {
        resolve(contrac)
      }
    })
  }).catch((err) => {
    console.error(err)
    return err
  })
  // log('存储 abi')
  contrac = await storeAbiToBlockchain(contractInfo, web3, contrac)
  return contrac
}

const deploy = async (contractInfo, web3) => {
  const { bytecode, abi, validUntilBlock } = contractInfo
  const contract = web3.eth.contract(abi)
  const ins = await new Promise((resolve, reject) => {
    // log('获取块高度')
    if (validUntilBlock === undefined) {
      initBlockNumber(web3, async (blockNumber) => {
        contractInfo.validUntilBlock = blockNumber + 88
        // log('部署合约')
        // log('contractInfo.validUntilBlock', contractInfo.validUntilBlock)
        const ins: any = await deployContract(contractInfo, web3, contract)
        resolve(ins)
      })
    } else if (typeof validUntilBlock === 'number') {
      const ins: any = deployContract(contractInfo, web3, contract)
      resolve(ins)
    } else {
      reject()
    }
  }).catch((err) => {
    console.error(err)
    return err
  })
  // log('获得返回值')
  return ins
}

export default deploy
