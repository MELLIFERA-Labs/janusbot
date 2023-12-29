export interface Network {
  key: string
  'chain-id': string
  'hd-path': string
  prefix: string
  denom: string
  'wallet-key': string[]
  transport: string
  decimals: number
  explorer?: {
    proposal?: string,
    trx?: string
  }
  net: {
    rpc: string[]
  }
}

export interface Transport {
  key: string
  type: string
  'bot-token': string
  'chat-id': string
}

export interface Config {
  dotenv?: string
  transport: Transport[]
  network: Network[]
}

