// const utf8 = require('utf8')
// var log = require('../utils/log').title('contract/utils')


// const fromUtf8 = function(str) {
//   str = utf8.encode(str)
//   let hex = ''
//   const size = str.length
//   for (let i = 0; i < size; i++) {
//     const code = str.charCodeAt(i)
//     if (code === 0) {
//       break
//     }
//     const n = code.toString(16)
//     hex += n.length < 2 ? '0' + n : n
//   }

//   return hex
// }

// const pollingReceipt = (web3, hash) => {
//   log('pollingReceipt hash:', hash)
//   let remain = 20
//   const p = new Promise((resolve, reject) => {
//     const func = () => {
//       web3.appchain
//         .getTransactionReceipt(hash)
//         .then((receipt) => {
//           remain--
//           log(remain)
//           if (receipt) {
//             resolve(receipt)
//           } else if (remain < 0) {
//             reject('fetch transaction receipt overtime')
//           } else {
//             setTimeout(func, 1000)
//           }
//         })
//         .catch((err) => {
//           reject(err)
//         })
//     }
//     func()
//   })
//   return p
// }

// module.exports = {
//   fromUtf8,
//   pollingReceipt,
// }