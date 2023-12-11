import Ajv from 'ajv'
import type ConfigType from './types/config'
import { BASE_DIR_DEFAULT, KEYS_FOLDER } from './constants'
import { checkInitFolder } from './utils'
import path from 'path'
import fs from 'fs'

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
          'bot-token': { type: 'string' },
          'chat-id': { type: 'string' },
        },
        required: ['key', 'type', 'bot-token', 'chat-id'],
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
export const validateProcessConfig = async (
  config: ConfigType,
): Promise<ValidateResponse> => {
  // 1. check that chaind id match with rpc
  for (const network of config.network) {
    const rpc = network.net.rpc
    const chainId = network['chain-id']
    for (const rpcUrl of rpc) {
      const statusRPC = new URL('/status', rpcUrl).href
      const response = await fetch(statusRPC)
      const data = (await response.json()) as any
      if (Boolean(data.result) && data.result.node_info.network !== chainId) {
        return {
          isValid: false,
          errors: `Network "${network.key}" has chain id "${chainId}", but rpc "${rpcUrl}" has chain id "${data.result.node_info.network}"`,
        }
      }
    }
    // 3. Check that keys exists
    for (const key of network['wallet-key']) {
      const pathToKeys = path.join(BASE_DIR_DEFAULT, KEYS_FOLDER)
      checkInitFolder(pathToKeys)
      const keys = fs.readdirSync(pathToKeys)
      if (!keys.includes(`${key.trim()}.json`)) {
        return {
          isValid: false,
          errors: `Network "${network.key}" has wallet-key "${key}", but key "${key}" not found. You need add key "${key}" first`,
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
      }
    }
  }
  // 2. check that transport env vars  exists in env
  for (const transport of config.transport) {
    const botToken = transport['bot-token'].replace('env.', '')
    const chatId = transport['chat-id'].replace('env.', '')
    if (process.env[botToken] === undefined) {
      return {
        isValid: false,
        errors: `Transport "${transport.key}" has bot-token "${botToken}", but env var "${botToken}" not found`,
      }
    }
    if (process.env[chatId] === undefined) {
      return {
        isValid: false,
        errors: `Transport "${transport.key}" has chat-id "${chatId}", but env var "${chatId}" not found`,
      }
    }
  }
  // 5. Check transport
  return {
    isValid: true,
    errors: null,
  }
}
