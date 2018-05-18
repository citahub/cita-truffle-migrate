"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var getRandomInt = function () {
    return Math.floor(Math.random() * 100).toString();
};
exports.getRandomInt = getRandomInt;
var getTransactionReceipt = function (web3, hash, callback) {
    var count = 0;
    var filter = web3.eth.filter('latest', function (err) {
        if (!err) {
            count++;
            if (count > 20) {
                filter.stopWatching(function () { });
            }
            else {
                web3.eth.getTransactionReceipt(hash, function (e, receipt) {
                    if (receipt) {
                        filter.stopWatching(function () { });
                        callback(receipt);
                    }
                });
            }
        }
        else {
        }
    });
};
exports.getTransactionReceipt = getTransactionReceipt;
var initBlockNumber = function (web3, callback) {
    web3.eth.getBlockNumber(function (err, blockNumber) {
        if (!err) {
            callback(blockNumber);
        }
        else {
            console.error(err);
        }
    });
};
exports.initBlockNumber = initBlockNumber;
//# sourceMappingURL=contract_utils.js.map