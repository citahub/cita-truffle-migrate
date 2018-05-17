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
var timeTest = function (n, f, title) {
    var t0 = Date.now();
    for (var i = 0; i < n; i++) {
        f();
    }
    var t1 = Date.now();
    var t = t1 - t0;
    if (title) {
        log.t("\u6D4B\u8BD5\u5185\u5BB9: " + title);
    }
    log.t("\u6D4B\u8BD5\u65F6\u95F4: " + t + " \u6D4B\u8BD5\u6B21\u6570: " + n);
    return t;
};
module.exports = log;
//# sourceMappingURL=log.js.map