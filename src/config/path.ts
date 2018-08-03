import * as path from 'path'
// import log from '../utils/log'

const __root = process.cwd()

const rootPathOf = (filePath) => {
  console.log('root', filePath)
  const rootPath = __root
  const p = path.resolve(rootPath, filePath)
  return p
}

const PathTable = {
  contracts: rootPathOf('./build/contracts'),
  migrations: rootPathOf('./migrations'),
  truffleConfig: rootPathOf('./truffle.js'),
  citaConfig: rootPathOf('./truffle-cita.js'),
}

export { __root, PathTable, rootPathOf }
