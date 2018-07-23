#!/usr/bin/env node

import * as fs from 'fs'
import * as path from 'path'
import deploy from './deploy'
import Web3 from '@nervos/web3'
import { getRandomInt } from './contract_utils'
import log from './log'

const __root = process.cwd()

const rootPathOf = (filePath) => {
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

const dirFilesRequire = (dir: string) => {
  const p = rootPathOf(dir)
  const files = fs.readdirSync(p)
  const list = []
  files.forEach((file, i) => {
    const filePath = path.resolve(p, file)
    const f = require(filePath)
    list.push(f)
  })
  return list
}

const parsedCommandArgs = () => {
  const { argv } = process
  let args = []
  if (argv.length >= 3) {
    args = argv.splice(2)
  }
  return args
}

const newProviderWeb3 = (network) => {
  let { provider } = network
  if (!provider) {
    const { host, port } = network
    provider = `http://${host}:${port}/`
  }
  const web3 = Web3(provider)
  return web3
}

const parsedWeb3Network = (args) => {
  const p = PathTable.citaConfig
  const config = require(p)
  const { networks } = config
  let network
  if (args[0] === '--network') {
    network = networks[args[1]]
  } else {
    network = networks.development
  }
  const web3 = newProviderWeb3(network)
  return { web3, network }
}

const newDeployer = (web3, userParams) => {
  log('newDeployer')
  const deployStart = async (contracName) => {
    const p = path.resolve(PathTable.contracts, contracName)
    const { bytecode, abi } = require(p)
    const info = Object.assign({ bytecode, abi }, userParams)
    await deploy(info, web3)
    }
  const deployer = {
    deploy: deployStart,
  }
  return deployer
}

const validParams = () => {
  const userParams = require(PathTable.citaConfig).contractInfo
  const { privateKey, chainId } = userParams
  if (privateKey === '' || typeof privateKey !== 'string') {
    throw '\nplease set your private key as a string, and make sure other people while not get it'
  }
  if (typeof chainId !== 'number') {
    throw '\nplease set your chain id as a number'
  }
  const keyTypeTable = {
    privateKey: 'string',
    chainId: 'number',
    nonce: 'string',
    quota: 'number',
    version: 'number',
    validUntilBlock: 'number',
  }
  const validParams = {
    // to: '',
    nonce: getRandomInt(),
    quota: 999999,
    validUntilBlock: undefined,
    version: 0,
    value: '0',
  }
  const keys = Object.keys(keyTypeTable)
  Object.keys(userParams).forEach((key) => {
    if (keys.includes(key)) {
      const value = userParams[key]
      if (typeof value === keyTypeTable[key]) {
        validParams[key] = value
      } else {
        throw `\nType Error: [${key}] should be a [${keyTypeTable[key]}]`
      }
    }
  })
  return validParams
}

const migrate = async (web3, network) => {
  log('migrate')
  const funcs = dirFilesRequire(PathTable.migrations)

  const params = validParams()

  const deployer = newDeployer(web3, params)

  const len = funcs.length
  for (let i = 0; i < len; i++) {
    const func = funcs[i]
    await func(deployer, network)
  }

  // const runAllFunc = async () => {
    
  // }
  // await runAllFunc()
}

const main = () => {
  log('start')
  const args = parsedCommandArgs()
  const { web3, network } = parsedWeb3Network(args)
  migrate(web3, network)
}

main()
