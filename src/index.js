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
var fs = require('fs');
var path = require('path');
var deployer = require('./deployer');
var log = console.log.bind(console, '>>>');
log('migrate start');
var dirFilesRequire = function (dir) {
    var p = path.resolve(__dirname, dir);
    var files = fs.readdirSync(p);
    var a = [];
    files.forEach(function (file, i) {
        var content = require(p + '/' + file);
        a.push(content);
    });
    return a;
};
var contracts = function () {
    var dir = '../build/contracts';
    var cons = dirFilesRequire(dir);
    return cons;
};
var deploy = function () { return __awaiter(_this, void 0, void 0, function () {
    var _this = this;
    var cons, insList, deploy, deployAll;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                cons = contracts();
                insList = [];
                deploy = function (con, i) {
                    var ins = deployer(con);
                    insList.push(ins);
                };
                deployAll = function () { return __awaiter(_this, void 0, void 0, function () {
                    var len, i, con, ins;
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0:
                                len = cons.length;
                                i = 0;
                                _a.label = 1;
                            case 1:
                                if (!(i < len)) return [3 /*break*/, 4];
                                con = cons[i];
                                return [4 /*yield*/, deployer(con)];
                            case 2:
                                ins = _a.sent();
                                insList.push(ins);
                                _a.label = 3;
                            case 3:
                                i++;
                                return [3 /*break*/, 1];
                            case 4:
                                // await cons.forEach(await deploy)
                                log('deploy all');
                                return [2 /*return*/];
                        }
                    });
                }); };
                return [4 /*yield*/, deployAll()];
            case 1:
                _a.sent();
                return [2 /*return*/, insList];
        }
    });
}); };
var test = function () { return __awaiter(_this, void 0, void 0, function () {
    var insList;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, deploy()];
            case 1:
                insList = _a.sent();
                log('这里应该最后出现');
                return [4 /*yield*/, log.apply(void 0, ['ins list'].concat(insList.map(function (ins) { return ins.address; })))];
            case 2:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); };
var main = function () {
    test();
};
main();