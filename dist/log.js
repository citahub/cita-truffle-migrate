"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var lg = console.log.bind(console);
var log = console.log.bind(console, '>>>');
log.t = function (title) {
    lg("--- " + title + " ---");
};
log.b = function (title) {
    var args = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        args[_i - 1] = arguments[_i];
    }
    log.t(title);
    lg.apply(void 0, args);
};
exports.default = log;
//# sourceMappingURL=log.js.map