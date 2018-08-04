import * as path from 'path'
import { PathTable } from '../config/path'
import deploy from './deploy'

const newDeployer = (web3, userParams) => {
  const paramsFormArtifact = (artifact) => {
    const p = path.resolve(PathTable.contracts, artifact.build)
    const { bytecode, abi } = require(p)
    const params = Object.assign({ bytecode, abi }, userParams)
    return params
  }

  const deploySingle = async (artifact) => {
    const params = paramsFormArtifact(artifact)
    return await deploy(params, web3, artifact, [])
  }

  const deploySingleWithArgs = async (artifact, args) => {
    const params = paramsFormArtifact(artifact)
    return await deploy(params, web3, artifact, args)
  }

  const deploySingleWithParams = async (artifact, args, userparams) => {
    let params = paramsFormArtifact(artifact)
    Object.assign(params, userparams)
    return await deploy(params, web3, artifact, args)
  }

  const deploySingleWithoutDeployed = async (artifact, args, userparams) => {
    // TODO: {overwrite: false}
    throw '{overwrite: false} is not supported'
  }

  const deployMany = async (argslist) => {
    // TODO: deploy([[A, arg1, arg2, ...],B,[C, arg1]]
    // throw '[[A, arg1, arg2, ...],B,[C, arg1]] is not supported'
    const deploys = argslist.map(async (args) => {
      return await deployByArguments(args)
    })
    return Promise.all(deploys)
  }

  const deployByArguments = async (args) => {
    if (Array.isArray(args[0])) {
      const arglist = args[0]
      return await deployMany(args)
    } else {
      // TODO: 需要 artifact.require
      const artifact = args.shift()
      if (args.length === 0) {
        return await deploySingle(artifact)
      } else {
        const size = args.length
        const lastArg = args[size - 1]
        if (typeof lastArg === 'object') {
          const params = args.pop()
          if (params.overwrite === false) {
            return await deploySingleWithoutDeployed(artifact, args, params)
          } else {
            delete params.overwrite
            return await deploySingleWithParams(artifact, args, params)
          }
        } else {
          return await deploySingleWithArgs(artifact, args)
        }
      }
    }
  }

  const deployAsync = async (...args) => {
    return await deployByArguments(args)
  }

  const deployer = {
    deploy: deployAsync,
  }

  return deployer
}

export default newDeployer
