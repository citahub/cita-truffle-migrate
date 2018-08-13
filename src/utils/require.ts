var fs = require('fs')
var path = require('path')
var Module = require('module')
var vm = require('vm')
var originalrequire = require('original-require')
var Web3 = require('@nervos/web3')
const log = console.log.bind(console, '-- truffle-require --\n')

// filename: path to file to execute. Must be a module that exports a function.
// options.args: arguments passed to the exported function within file. If a callback
//   is not included in args, exported function is treated as synchronous.
// newContext: Object containing any global variables you'd like set when this
//   function is run.

const defaultContext = {
  Buffer: Buffer,
  clearImmediate: clearImmediate,
  clearInterval: clearInterval,
  clearTimeout: clearTimeout,
  console: console,
  exports: exports,
  global: global,
  process: process,
  setImmediate: setImmediate,
  setInterval: setInterval,
  setTimeout: setTimeout,
}

// 这里是虚拟机里运行的代码中的 require
const requireInNewFile = function(pkgPath) {
  // Ugh. Simulate a full require function for the file.
  pkgPath = pkgPath.trim()

  // If absolute, just require.
  if (path.isAbsolute(pkgPath)) {
    return originalrequire(pkgPath)
  }

  // If relative, it's relative to the file.
  if (pkgPath[0] == '.') {
    return originalrequire(path.join(path.dirname(file), pkgPath))
  } else {
    // Not absolute, not relative, must be a globally or locally installed module.

    // Try local first.
    // Here we have to require from the node_modules directory directly.

    var moduleDir = path.dirname(file)
    while (true) {
      try {
        return originalrequire(path.join(moduleDir, 'node_modules', pkgPath))
      } catch (e) { }
      var oldModuleDir = moduleDir
      moduleDir = path.join(moduleDir, '..')
      if (moduleDir === oldModuleDir) {
        break
      }
    }

    // Try global, and let the error throw.
    return originalrequire(pkgPath)
  }
}

// 主要是这个 resolver
const file = function (filename, resolver, done, newContext = {} ) {
  fs.readFile(filename, { encoding: 'utf8' }, function(err, source) {
    if (err) return done(err)

    // Modified from here: https://gist.github.com/anatoliychakkaev/1599423
    var m = new Module(filename)
    const dirname = path.dirname(filename)

    // Provide all the globals listed here: https://nodejs.org/api/globals.html
    var context = {
      ...defaultContext,
      __dirname: dirname,
      __filename: filename,
      module: m,
      require: requireInNewFile,
      artifacts: resolver,
    }

    // Now add contract names.
    // 引入传入的环境变量
    Object.keys(newContext).forEach(function(key) {
      context[key] = newContext[key]
    })

    var olddir = process.cwd()

    process.chdir(dirname)

    // vm.createScript 这个已经弃用了...
    var script = vm.createScript(source, filename)
    script.runInNewContext(context)

    process.chdir(olddir)

    // m.exports 就是迁移函数里的 module.exports
    done(null, m.exports)
  })
}

// 如果只是引入一个 web3, 根本不需要特意写一个函数, 完全可以让引用的人自己写
// 暂弃
const exec = function(filename, provider, resolver, done) {
  var web3 = new Web3()
  web3.setProvider(provider)

  file(
    filename,
    resolver,
    {
      web3: web3,
    },
    function(err, fn) {
      if (err) return done(err)
      fn(done)
    }
  )
}

var Require = {
  file,
  exec,
}

// module.exports = Require
export default Require