const utf8 = require('utf8')
const Nervos = require('@nervos/chain').default
var log = require('./log').title('utils/nervos')

const fromUtf8 = function(str) {
  str = utf8.encode(str)
  let hex = ''
  const size = str.length
  for (let i = 0; i < size; i++) {
    const code = str.charCodeAt(i)
    if (code === 0) {
      break
    }
    const n = code.toString(16)
    hex += n.length < 2 ? '0' + n : n
  }

  return hex
}

const currentValidUntilBlock = (nervos, blocknumberAdd = 88) => {
  return nervos.appchain.getBlockNumber().then((number) => {
    const num = Number(number) + Number(blocknumberAdd)
    return num
  })
}

const deployContract = (contract, data, arguments, txParams) => {
  const { privateKey, from, nonce, quota, chainId, version, validUntilBlock } = txParams
  const tx = { privateKey, from, nonce, quota, chainId, version, validUntilBlock }
  return contract.deploy({ data, arguments }).send(tx)
}

const storeAbi = (nervos, contractAddress, abi, txParams) => {
  let abibytes = fromUtf8(JSON.stringify(abi))
  // const address = res.contractAddress
  const data = contractAddress + abibytes
  const { validUntilBlock, chainId, nonce, version, quota, privateKey, from } = txParams
  // 存 abi 的固定地址
  const to = 'ffffffffffffffffffffffffffffffffff010001'
  const tx = {
    from,
    to,
    quota,
    version,
    nonce,
    data,
    validUntilBlock,
    chainId,
    privateKey,
  }
  // log('storing abi...')
  return nervos.appchain.sendTransaction(tx)
}

const pollingReceipt = (nervos, hash) => {
  // log('pollingReceipt hash:', hash)
  let remain = 20
  const p = new Promise((resolve, reject) => {
    const func = () => {
      nervos.appchain
        .getTransactionReceipt(hash)
        .then((receipt) => {
          remain--
          // log(remain)
          if (receipt) {
            resolve(receipt)
          } else if (remain < 0) {
            reject('fetch transaction receipt overtime')
          } else {
            setTimeout(func, 1000)
          }
        })
        .catch((err) => {
          reject(err)
        })
    }
    func()
  })
  return p
}

module.exports = {
  fromUtf8,
  currentValidUntilBlock,
  deployContract,
  storeAbi,
  pollingReceipt,
}
