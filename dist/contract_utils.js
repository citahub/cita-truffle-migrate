"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var privkey = '352416e1c910e413768c51390dfd791b414212b7b4fe6b1a18f58007fa894214';
var quota = 999999;
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
var initBlockNumber2 = function (web3, callback) {
    web3.eth.getBlockNumber(function (err, res) {
        if (!err) {
            var commonParams = {
                privkey: privkey,
                nonce: getRandomInt(),
                quota: quota,
                validUntilBlock: res + 88,
                version: 0,
            };
            callback(commonParams);
        }
        else {
            console.error(err);
        }
    });
};
//# sourceMappingURL=contract_utils.js.map