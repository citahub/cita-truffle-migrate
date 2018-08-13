var Schema = require('truffle-contract-schema')
import Contract from './contract'

var contract: any = function(options) {
  var binary = Schema.normalize(options || {})

  // Note we don't use `new` here at all. This will cause the class to
  // "mutate" instead of instantiate an instance.
  return Contract.clone(binary)
}

module.exports = contract
