// const lg = console.log.bind(console)

const createdLog = () => {
  let open
  open = true
  let log
  if (open) {
    log = console.log.bind(console, '>>>')
  } else {
    log = () => {}
	}
	return log
}

const log = createdLog()

// log.t = function(title) {
//   lg('--- ' + title + ' ---')
// }

// log.b = function(title) {
//   var args = []
//   for (var _i = 1; _i < arguments.length; _i++) {
//     args[_i - 1] = arguments[_i]
//   }
//   log.t(title)
//   lg.apply(void 0, args)
// }
export default log
