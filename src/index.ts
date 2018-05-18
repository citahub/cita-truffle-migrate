#!/usr/bin/env node

import * as fs from 'fs'
import * as path from 'path'
import deployer from './deployer'
import * as Web3 from 'cita-web3'
import { getRandomInt } from './contract_utils'
// import log from './log'

const rootPath = process.cwd()

const dirFilesRequire = (dir: string) => {
  const p = path.resolve(rootPath, dir)
  const files = fs.readdirSync(p)
  const a = []
  files.forEach((file, i) => {
    const filePath = path.resolve(p, file)
    const content = require(filePath)
    a.push(content)
  })
  return a
}

const contractFileNames = () => {
  const dir = './build/contracts'
  const cons = dirFilesRequire(dir)
  return cons
}

const parsedCommandLine = () => {
  const { argv } = process
  let args = []
  if (argv.length >= 3) {
    args = argv.splice(2)
  }
  return args
}

const parsedNetorkWeb3 = (network: { host: string; port: number; provider: any }) => {
  const { host, port } = network
  let { provider } = network
  if (!provider) {
    const server = `http://${host}:${port}/`
    provider = new Web3.providers.HttpProvider(server)
  }
  const web3 = new Web3(provider)
  return web3
}

const parsedCommandWeb3 = (args: string[]) => {
  const p = path.resolve(rootPath, './truffle.js')
  const config = require(p)
  const { networks } = config
  let network
  if (args[0] === '--network') {
    network = networks[1]
  } else {
    network = networks.development
  }
  const web3 = parsedNetorkWeb3(network)
  return web3
}

const deploy = async (web3) => {
  const cons = contractFileNames()
  const insList = []
  const deployAll = async () => {
    const len = cons.length
    for (let i = 0; i < len; i++) {
      const { bytecode, abi } = cons[i]
      const chainId = 0
      const to = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      const privkey = '352416e1c910e413768c51390dfd791b414212b7b4fe6b1a18f58007fa894214'
      const nonce = getRandomInt()
      const quota = 999999
      const validUntilBlock = 0
      const version = 0
      const info = { bytecode, abi, to, chainId, privkey, nonce, quota, validUntilBlock, version }
      const ins = await deployer(info, web3)
      insList.push(ins)
    }
  }
  await deployAll()
  return insList
}

const migrate = async (web3) => {
  const insList = await deploy(web3)
  insList.forEach((ins) => {
    console.log('address:', ins.address)
  })
}

const main = () => {
  const args = parsedCommandLine()
  const web3 = parsedCommandWeb3(args)
  migrate(web3)
}

main()
