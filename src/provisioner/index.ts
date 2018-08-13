
// 既然主要是对 abstraction 的操作, 为什么不写到 abstraction 里?
// TODO: 
const provision = function(abstraction, options) {
  if (options.provider) {
    abstraction.setProvider(options.provider)
  }

  if (options.network_id) {
    abstraction.setNetwork(options.network_id)
  }

  const attrlist = ['from', 'gas', 'gasPrice']

  attrlist.forEach(function(key) {
    if (options[key]) {
      var obj = {}
      obj[key] = options[key]
      abstraction.defaults(obj)
    }
  })

  return abstraction
}

export { provision }
