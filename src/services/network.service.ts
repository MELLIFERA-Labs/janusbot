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
  const networkService = await Promise.all(
    config.network.map(async (net) => {
      // toodo: reconnect client by array of rpc
      const tendermintClient = await Tendermint34Client.connect(net.net.rpc[0])
      const query = QueryClient.withExtensions(
        tendermintClient,
        setupGovExtension,
      )
      const keysWithClients = await Promise.all(
        net['wallet-key'].map(async (w) => {
          // todo: create help function getWallet
          const wallet = JSON.parse(
            fs.readFileSync(path.join(pathToKeys, `${w}.json`), 'utf8'),
          )
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
            cosmClient: await SigningStargateClient.connectWithSigner(
              net.net.rpc[0],
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
