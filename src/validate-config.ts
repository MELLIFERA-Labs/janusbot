import Ajv from 'ajv'
import { Config as ConfigType } from './types/config'
import { BASE_DIR_DEFAULT, KEYS_FOLDER, TELEGRAM_TOKEN_ENV } from './constants'
import { FsService } from './services/fs.service'
import path from 'path'
import fs from 'fs'
import { urlResolve } from './utils/helper'
import { fetchWithTimeout } from './utils/helper'
import cliLogService from './services/cli-log.service'
import { RPCStatusResponse } from './types/rpc'

const configSchema = {
  type: 'object',
  properties: {
    transport: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          key: { type: 'string', pattern: '^[a-zA-Z0-9_-]+$' },
          type: { type: 'string' },
          'chat-id': { type: 'string' },
        },
        required: ['key', 'type', 'chat-id'],
      },
      minItems: 1, // Ensure at least one element in the array
    },
    network: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          key: { type: 'string', pattern: '^[a-zA-Z0-9_-]+$' },
          'chain-id': { type: 'string' },
          'hd-path': { type: 'string' },
          denom: { type: 'string' },
          'wallet-key': {
            type: 'array',
            items: { type: 'string' },
            minItems: 1,
          },
          transport: {
            type: 'string',
            pattern: '^[a-zA-Z0-9_-]+$', // Ensure string is valid key
          },
          decimals: { type: 'number' },
          net: {
            type: 'object',
            properties: {
              rpc: {
                type: 'array',
                items: { type: 'string', pattern: '^(https?|http?)://' }, // Ensure array items are valid URLs
              },
            },
            required: ['rpc'],
          },
        },
        required: [
          'key',
          'prefix',
          'chain-id',
          'hd-path',
          'denom',
          'net',
          'wallet-key',
          'transport',
          'decimals',
        ],
      },
      minItems: 1, // Ensure at least one element in the array
    },
  },
  required: ['transport', 'network'],
}
const ajv = new Ajv()

interface ValidateResponse {
  isValid: boolean
  errors: null | string
}
interface ValidateProcessResponse extends ValidateResponse {
  config: null | ConfigType
}
export const validateConfig = (config: ConfigType): ValidateResponse => {
  const isValid = ajv.validate(configSchema, config)
  if (isValid) {
    return {
      isValid,
      errors: null,
    }
  }
  return {
    isValid,
    errors: ajv.errorsText(),
  }
}

type RPCStatusResponse = {
  result: {
    node_info: {
      network: string
    }
  }
}
export const validateProcessConfig = async (
  config: ConfigType,
): Promise<ValidateProcessResponse> => {
  const isValidConfig = validateConfig(config)
  if (!isValidConfig.isValid) {
    return {
      ...isValidConfig,
      config: null,
    }
  }
  // 1. check that chaind id match with rpc
  for (const network of config.network) {
    const rpc = network.net.rpc
    const chainId = network['chain-id']
    let failedRequests = 0
    for (const rpcUrl of rpc) {
      const statusRPC = urlResolve(rpcUrl, '/status')
      let data: RPCStatusResponse
      try {
        const response = await fetchWithTimeout(statusRPC)
        data = (await response.json()) as RPCStatusResponse
        if (Boolean(data.result) && data.result.node_info.network !== chainId) {
          return {
            isValid: false,
            errors: `Network "${network.key}" has chain id "${chainId}", but rpc "${rpcUrl}" has chain id "${data.result.node_info.network}"`,
            config: null,
          }
        }
      } catch (error) {
        failedRequests++
        if (failedRequests === rpc.length) {
          return {
            isValid: false,
            errors: `All rpc requests failed for network "${network.key}"`,
            config: null,
          }
        }
        if ((error as Error).name === 'AbortError') {
          cliLogService.warn(`Request to ${statusRPC} timeout`)
        } else {
          cliLogService.warn(
            `Request to ${statusRPC} failed with error "${
              (error as Error).message
            }"`,
          )
        }
      }
    }
    // 3. Check that keys exists
    for (const key of network['wallet-key']) {
      const pathToKeys = path.join(BASE_DIR_DEFAULT, KEYS_FOLDER)
      FsService.checkInitFolder(pathToKeys)
      const keys = fs.readdirSync(pathToKeys)
      if (!keys.includes(`${key.trim()}.json`)) {
        return {
          isValid: false,
          errors: `Network "${network.key}" has wallet-key "${key}", but key "${key}" not found. You need add key "${key}" first`,
          config: null,
        }
      }
    }
    // 4. Check that transport exists
    const transport = config.transport.find(
      (transport) => transport.key === network.transport,
    )
    if (transport === undefined) {
      return {
        isValid: false,
        errors: `Network "${network.key}" has transport "${network.transport}", but transport "${network.transport}" not found`,
        config: null,
      }
    }
  }
  // 2. check that transport env vars  exists in env
  for (const transport of config.transport) {
    if (
      transport.type === 'telegram' &&
      process.env[TELEGRAM_TOKEN_ENV] === undefined
    ) {
      return {
        isValid: false,
        errors: `Transport "${transport.key}" exists, but env var "${TELEGRAM_TOKEN_ENV}" not found`,
        config: null,
      }
    }
  }
  // 5. Check transport
  return {
    isValid: true,
    errors: null,
    config: config,
  }
}
