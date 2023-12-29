import {
  SigningStargateClient,
  QueryClient,
  setupGovExtension,
  type GovExtension,
} from '@cosmjs/stargate'
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing'
import { Tendermint34Client } from '@cosmjs/tendermint-rpc'
import { Config as ConfigType, Network as NetworkConfig} from '../types/config'
import { BASE_DIR_DEFAULT, KEYS_FOLDER } from '../constants'
import path from 'path'
import fs from 'fs'
import { type Notifier } from '../bot/common/notifier'
import { TelegramNotifier } from '../bot/telegram/notifier'
import RpcReConnectClient from '../utils/rpc-reconnect-client';
import { FsService } from './fs.service'
import logger from '../services/app-logger.service'
const log = logger('services:network')
const pathToKeys = path.join(BASE_DIR_DEFAULT, KEYS_FOLDER)
export interface KeyWithClient {
  key: string
  address: string
  cosmClient: SigningStargateClient
}
export interface NetworkService {
  networkKey: string
  queryClient: QueryClient & GovExtension
  keys: KeyWithClient[]
  notifier: Notifier
  networkConfig: NetworkConfig
}

export const createNetworkProvider = async (
  config: ConfigType,
): Promise<NetworkService[]> => {
  const fsService = new FsService(BASE_DIR_DEFAULT)
  const networkService = await Promise.all(
    config.network.map(async (net) => {
       const rpcClient = new RpcReConnectClient(net.net.rpc);
      rpcClient.on('info', data => log.info({ data, tag: 'sign' }, 'made rpc call'))
      rpcClient.on('warning', data => log.warn({ data, tag: 'sign' }, 'failed rpc call before reconnect'))
      const tendermintClient = await Tendermint34Client.create(rpcClient);  
      const query = QueryClient.withExtensions(
        tendermintClient,
        setupGovExtension,
      )
      const keysWithClients = await Promise.all(
        net['wallet-key'].map(async (w) => {
          const wallet = fsService.readKeyData(w)
          const signer = await DirectSecp256k1HdWallet.fromMnemonic(
            wallet.mnemonic,
            {
              prefix: net.prefix,
            },
          )
          const accounts = await signer.getAccounts()
          return {
            key: w,
            address: accounts[0].address,
            cosmClient: await SigningStargateClient.createWithSigner(
              tendermintClient,
              signer,
            ),
          }
        }),
      )
      const transport = config.transport.find((t) => t.key === net.transport)
      if (!transport) throw new Error(`Transport ${net.transport} not found`)
      return {
        networkKey: net.key,
        keys: keysWithClients,
        queryClient: query,
        networkConfig: net,
        notifier: new TelegramNotifier(
          {
            BOT_CHAT_ID: transport['chat-id'],
          },
          keysWithClients,
        ),
      }
    }),
  )
  return networkService
}
