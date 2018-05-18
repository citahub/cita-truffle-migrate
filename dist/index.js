#!/usr/bin/env node
"use strict";
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
var fs = require("fs");
var path = require("path");
var deployer_1 = require("./deployer");
var Web3 = require("cita-web3");
var contract_utils_1 = require("./contract_utils");
var rootPath = process.cwd();
var dirFilesRequire = function (dir) {
    var p = path.resolve(rootPath, dir);
    var files = fs.readdirSync(p);
    var a = [];
    files.forEach(function (file, i) {
        var filePath = path.resolve(p, file);
        var content = require(filePath);
        a.push(content);
    });
    return a;
};
var contractFileNames = function () {
    var dir = './build/contracts';
    var cons = dirFilesRequire(dir);
    return cons;
};
var parsedCommandLine = function () {
    var argv = process.argv;
    var args = [];
    if (argv.length >= 3) {
        args = argv.splice(2);
    }
    return args;
};
var parsedNetorkWeb3 = function (network) {
    var host = network.host, port = network.port;
    var provider = network.provider;
    if (!provider) {
        var server = "http://" + host + ":" + port + "/";
        provider = new Web3.providers.HttpProvider(server);
    }
    var web3 = new Web3(provider);
    return web3;
};
var parsedCommandWeb3 = function (args) {
    var p = path.resolve(rootPath, './truffle.js');
    var config = require(p);
    var networks = config.networks;
    var network;
    if (args[0] === '--network') {
        network = networks[1];
    }
    else {
        network = networks.development;
    }
    var web3 = parsedNetorkWeb3(network);
    return web3;
};
var deploy = function (web3) { return __awaiter(_this, void 0, void 0, function () {
    var _this = this;
    var cons, insList, deployAll;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                cons = contractFileNames();
                insList = [];
                deployAll = function () { return __awaiter(_this, void 0, void 0, function () {
                    var len, i, _a, bytecode, abi, chainId, to, privkey, nonce, quota, validUntilBlock, version, info, ins;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                len = cons.length;
                                i = 0;
                                _b.label = 1;
                            case 1:
                                if (!(i < len)) return [3, 4];
                                _a = cons[i], bytecode = _a.bytecode, abi = _a.abi;
                                chainId = 0;
                                to = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
                                privkey = '352416e1c910e413768c51390dfd791b414212b7b4fe6b1a18f58007fa894214';
                                nonce = contract_utils_1.getRandomInt();
                                quota = 999999;
                                validUntilBlock = 0;
                                version = 0;
                                info = { bytecode: bytecode, abi: abi, to: to, chainId: chainId, privkey: privkey, nonce: nonce, quota: quota, validUntilBlock: validUntilBlock, version: version };
                                return [4, deployer_1.default(info, web3)];
                            case 2:
                                ins = _b.sent();
                                insList.push(ins);
                                _b.label = 3;
                            case 3:
                                i++;
                                return [3, 1];
                            case 4: return [2];
                        }
                    });
                }); };
                return [4, deployAll()];
            case 1:
                _a.sent();
                return [2, insList];
        }
    });
}); };
var migrate = function (web3) { return __awaiter(_this, void 0, void 0, function () {
    var insList;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4, deploy(web3)];
            case 1:
                insList = _a.sent();
                insList.forEach(function (ins) {
                    console.log('address:', ins.address);
                });
                return [2];
        }
    });
}); };
var main = function () {
    var args = parsedCommandLine();
    var web3 = parsedCommandWeb3(args);
    migrate(web3);
};
main();
//# sourceMappingURL=index.js.map