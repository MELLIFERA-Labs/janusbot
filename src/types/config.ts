interface Network {
  key: string
  'chain-id': string
  'hd-path': string
  prefix: string
  denom: string
  'wallet-key': string[]
  transport: string
  net: {
    rpc: string[]
  }
}

interface Transport {
  key: string
  type: string
  'bot-token': string
  'chat-id': string
}

interface Config {
  transport: Transport[]
  network: Network[]
}

export default Config
