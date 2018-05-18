#!/usr/bin/env node

import * as fs from 'fs'
import * as path from 'path'
import deploy from './deploy'
import * as Web3 from 'cita-web3'
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

const newProviderWeb3 = (network: { host: string; port: number; provider: any }) => {
  const { host, port } = network
  let { provider } = network
  if (!provider) {
    const server = `http://${host}:${port}/`
    provider = new Web3.providers.HttpProvider(server)
  }
  const web3 = new Web3(provider)
  return web3
}

const parsedWeb3Network = (args: string[]) => {
  const p = PathTable.citaConfig
  const config = require(p)
  const { networks } = config
  let network
  if (args[0] === '--network') {
    network = networks[1]
  } else {
    network = networks.development
  }
  const web3 = newProviderWeb3(network)
  return { web3, network }
}

const newDeployer = function(web3, userParams) {
  const deployStart = async (contracsName) => {
    const conpath = path.resolve(PathTable.contracts, contracsName)
    const con = require(conpath)
    const { bytecode, abi } = con
    const info = Object.assign({ bytecode, abi }, userParams)
    const ins = await deploy(info, web3)
    console.log('address:', ins.address)
    return ins
  }
  const deployer = {
    deploy: deployStart,
  }
  return deployer
}

const migrate = async (web3, network) => {
  const funcs = dirFilesRequire(PathTable.migrations)
  const userParams = require(PathTable.citaConfig).contractInfo

  const defaultInfo = {
    chainId: 0,
    to: 'to',
    privkey: 'privkey',
    nonce: getRandomInt(),
    quota: 999999,
    validUntilBlock: 0,
    version: 0,
  }

  Object.assign(defaultInfo, userParams)

  const deployer = newDeployer(web3, defaultInfo)

  const runAllFunc = async (web3) => {
    const len = funcs.length
    for (let i = 0; i < len; i++) {
      const func = funcs[i]
      await func(deployer, network)
    }
  }
  await runAllFunc(web3)
}

const main = () => {
  const args = parsedCommandArgs()
  const { web3, network } = parsedWeb3Network(args)
  migrate(web3, network)
}

main()
