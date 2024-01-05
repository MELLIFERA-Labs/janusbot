import {
  SigningStargateClient,
  QueryClient,
  setupGovExtension,
  type GovExtension,
} from '@cosmjs/stargate'
import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing'
import {
  Tendermint34Client,
  Tendermint37Client,
  Comet38Client,
} from '@cosmjs/tendermint-rpc'
import { Config as ConfigType, Network as NetworkConfig } from '../types/config'
import { BASE_DIR_DEFAULT } from '../constants'
import { type Notifier } from '../bot/common/notifier'
import { TelegramNotifier } from '../bot/telegram/notifier'
import RpcReConnectClient from '../utils/rpc-reconnect-client'
import { FsService } from './fs.service'
import { fetchWithTimeout, urlResolve } from '../utils/helper'
import { RPCStatusResponse } from '../types/rpc'
import logger from '../services/app-logger.service'
import { stringToPath } from '@cosmjs/crypto'
const log = logger('services:network')

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
const getCometClient = async (rpc: string[]) => {
  const versionFromRPC = await (async () => {
    for (const rpcUrl of rpc) {
      try {
        const response = await fetchWithTimeout(urlResolve(rpcUrl, '/status'))
        const data = (await response.json()) as RPCStatusResponse
        return data.result.node_info.version
      } catch (error) {
        log.error(error)
      }
    }
    throw new Error('No one rpc is available')
  })()

  if (versionFromRPC.startsWith('0.37.')) {
    return Tendermint37Client
  } else if (versionFromRPC.startsWith('0.38.')) {
    return Comet38Client
  } else {
    return Tendermint34Client
  }
}
export const createNetworkProvider = async (
  config: ConfigType,
): Promise<NetworkService[]> => {
  const fsService = new FsService(BASE_DIR_DEFAULT)
  const networkService = await Promise.all(
    config.network.map(async (net) => {
      const rpcClient = new RpcReConnectClient(net.net.rpc)
      rpcClient.on('info', (data) =>
        log.info({ data, tag: 'sign' }, 'made rpc call'),
      )
      rpcClient.on('warning', (data) =>
        log.warn({ data, tag: 'sign' }, 'failed rpc call before reconnect'),
      )
      const CommetClient = await getCometClient(net.net.rpc)
      const tendermintClient = await CommetClient.create(rpcClient)
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
              hdPaths: [stringToPath(net['hd-path'])],
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
