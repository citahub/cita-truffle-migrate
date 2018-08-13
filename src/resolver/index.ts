var EPMSource = require('./epm')
var NPMSource = require('./npm')
var FSSource = require('./fs')
var whilst = require('async/whilst')
var contract = require('truffle-contract')
import { provision } from "../provisioner"
const log = console.log.bind(console, '--- resolver index.js\n')

function Resolver(options, working_directory, contracts_build_directory) {
  this.options = options

  this.sources = [
    // 这是设置了默认地址, 在 options 里, 可能是 config, 可能是 environment
    new EPMSource(working_directory, contracts_build_directory),
    new NPMSource(working_directory),
    new FSSource(working_directory, contracts_build_directory),
  ]
}

// This function might be doing too much. If so, too bad (for now).
// 读取 build 出的 json 文件, 然后处理为合约的抽象(contract abstraction)
Resolver.prototype.require = function (import_path, search_path) {
  const {sources, options} = this
  const size = sources.length
  // 查找调用 epm, npm, fs 中的相应文件
  for (var i = 0; i < size; i++) {
    var source = sources[i]
    var result = source.require(import_path, search_path)
    if (result) {
      // 转换为 truffle-contract 实例
      var abstraction = contract(result)
      // 只是对 contract abstraction 的接口调用和后续处理, 添加了 network, provider 等
      provision(abstraction, options)
      return abstraction
    }
  }
  // epm, npm, fs 都找不到就报错
  throw new Error('Could not find artifacts for ' + import_path + ' from any sources')
}

Resolver.prototype.resolve = function (import_path, imported_from, callback) {
  var self = this

  if (typeof imported_from == 'function') {
    callback = imported_from
    imported_from = null
  }

  var resolved_body = null
  var resolved_path = null
  var current_index = -1
  var current_source

  whilst(
    function () {
      return !resolved_body && current_index < self.sources.length - 1
    },
    function (next) {
      current_index += 1
      current_source = self.sources[current_index]

      current_source.resolve(import_path, imported_from, function (err, body, file_path) {
        if (!err && body) {
          resolved_body = body
          resolved_path = file_path
        }
        next(err)
      })
    },
    function (err) {
      if (err) return callback(err)

      if (!resolved_body) {
        var message = 'Could not find ' + import_path + ' from any sources'

        if (imported_from) {
          message += '; imported from ' + imported_from
        }

        return callback(new Error(message))
      }

      callback(null, resolved_body, resolved_path, current_source)
    }
  )
}

module.exports = Resolver
