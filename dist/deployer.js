"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [0, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
Object.defineProperty(exports, "__esModule", { value: true });
var utils_1 = require("./utils");
var contract_utils_1 = require("./contract_utils");
var storeAbiToBlockchain = function (contractInfo, web3, contract) { return __awaiter(_this, void 0, void 0, function () {
    var address, privkey, nonce, quota, bytecode, validUntilBlock, version, chainId, abi, to, hex, code, con;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                address = contract.address;
                privkey = contractInfo.privkey, nonce = contractInfo.nonce, quota = contractInfo.quota, bytecode = contractInfo.bytecode, validUntilBlock = contractInfo.validUntilBlock, version = contractInfo.version, chainId = contractInfo.chainId, abi = contractInfo.abi, to = contractInfo.to;
                hex = utils_1.default.fromUtf8(JSON.stringify(abi));
                hex = hex.slice(0, 2) === '0x' ? hex : hex.slice(2);
                code = (address.slice(0, 2) === '0x' ? address.slice(2) : address) + hex;
                return [4, new Promise(function (resolve, reject) {
                        var data = code;
                        var params = { privkey: privkey, nonce: nonce, quota: quota, validUntilBlock: validUntilBlock, version: version, to: to, data: data };
                        web3.eth.sendTransaction(__assign({}, params), function (err, res) {
                            if (err) {
                                reject(err);
                            }
                            else {
                                resolve(contract);
                            }
                        });
                    }).catch(function (err) {
                        console.error(err);
                        return err;
                    })];
            case 1:
                con = _a.sent();
                return [2, con];
        }
    });
}); };
var deployContract = function (contractInfo, web3, contract) { return __awaiter(_this, void 0, void 0, function () {
    var privkey, nonce, quota, bytecode, validUntilBlock, version, chainId, contrac;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                privkey = contractInfo.privkey, nonce = contractInfo.nonce, quota = contractInfo.quota, bytecode = contractInfo.bytecode, validUntilBlock = contractInfo.validUntilBlock, version = contractInfo.version, chainId = contractInfo.chainId;
                return [4, new Promise(function (resolve, reject) {
                        var data = bytecode;
                        var params = { privkey: privkey, nonce: nonce, quota: quota, validUntilBlock: validUntilBlock, version: version, data: data };
                        contract.new(__assign({}, params), function (err, contrac) {
                            if (err) {
                                reject(err);
                            }
                            else if (contrac.address) {
                                resolve(contrac);
                            }
                        });
                    }).catch(function (err) {
                        console.error(err);
                        return err;
                    })];
            case 1:
                contrac = _a.sent();
                return [4, storeAbiToBlockchain(contractInfo, web3, contrac)];
            case 2:
                contrac = _a.sent();
                return [2, contrac];
        }
    });
}); };
var deploy = function (contractInfo, web3) { return __awaiter(_this, void 0, void 0, function () {
    var _this = this;
    var bytecode, abi, contract, ins;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                bytecode = contractInfo.bytecode, abi = contractInfo.abi;
                contract = web3.eth.contract(abi);
                return [4, new Promise(function (resolve, reject) {
                        contract_utils_1.initBlockNumber(web3, function (blockNumber) { return __awaiter(_this, void 0, void 0, function () {
                            var ins;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        contractInfo.validUntilBlock = blockNumber + 88;
                                        return [4, deployContract(contractInfo, web3, contract)];
                                    case 1:
                                        ins = _a.sent();
                                        resolve(ins);
                                        return [2];
                                }
                            });
                        }); });
                    }).catch(function (err) {
                        console.error(err);
                        return err;
                    })];
            case 1:
                ins = _a.sent();
                return [2, ins];
        }
    });
}); };
exports.default = deploy;
//# sourceMappingURL=deployer.js.map