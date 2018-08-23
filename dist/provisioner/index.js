var provision = function(abstraction, options) {
  var self = this

  if (options.provider) {
    abstraction.setProvider(options.provider)
  }

  if (options.network_id) {
    abstraction.setNetwork(options.network_id)
  }

  const keys = ['from', 'nonce', 'quota', 'version', 'value', 'chainId', 'privateKey', 'to', 'validUntilBlock']

  keys.forEach(function(key) {
    if (options[key]) {
      var obj = {}
      obj[key] = options[key]
      abstraction.defaults(obj)
    }
  })

  return abstraction
}

module.exports = provision
