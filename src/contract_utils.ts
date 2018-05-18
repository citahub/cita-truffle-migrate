const getRandomInt = function() {
  return Math.floor(Math.random() * 100).toString()
}

const getTransactionReceipt = function(web3, hash, callback) {
  // wait for receipt
  var count = 0
  var filter = web3.eth.filter('latest', function(err) {
    if (!err) {
      count++
      if (count > 20) {
        filter.stopWatching(function() {})
      } else {
        web3.eth.getTransactionReceipt(hash, function(e, receipt) {
          if (receipt) {
            filter.stopWatching(function() {})
            callback(receipt)
          }
        })
      }
    } else {
      // no handle
    }
  })
}

const initBlockNumber = function(web3, callback) {
  web3.eth.getBlockNumber(function(err, blockNumber) {
    if (!err) {
      callback(blockNumber)
    } else {
      console.error(err)
    }
  })
}

export {
  getTransactionReceipt,
  initBlockNumber,
  getRandomInt,
}
