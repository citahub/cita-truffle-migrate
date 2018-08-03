import log from './log'
import * as utf8 from "utf8";
const utf8 = require('utf8')

const getRandomInt = function() {
  return Math.floor(Math.random() * 100).toString()
}

const fromUtf8 = function(str) {
  str = utf8.encode(str)
  let hex = ''
  const size = str.length
  for (let i = 0; i < size; i++) {
    const code = str.charCodeAt(i)
    if (code === 0) {
      break
    }
    const n = code.toString(16)
    hex += n.length < 2 ? '0' + n : n
  }

  return hex
}

export { 
  getRandomInt, 
  fromUtf8,
}
