import path from 'path'
import os from 'os'
const homeDirectory = os.homedir()

export const BASE_DIR_DEFAULT = path.join(homeDirectory, '.janus')
export const CONFIG_FILE_NAME = 'config.toml'
export const KEYS_FOLDER = 'keys'
export const DB_FOLDER = 'db'
export const TELEGRAM_TOKEN_ENV = 'TELEGRAM_BOT_TOKEN'
export const WORKER_INTERVAL = 60 * 1000 * 5 // 5 min
export const FETCH_REQUEST_TIMEOUT = 3000 // 3 sec
export const CONFIG_FILE_DEFAULT_CONTENT = `
# options parameter for file with env variables. Remove if you don't need it
dotenv = '.env'
# transports configuration
[[transport]]
# The unique name of the transport
key = 'telegram_cosmos_proposals'
# transport type
type = 'telegram'
# telegram chat id. Put your chat id here. Can be channel or your id for direct messages
chat-id = '<id>'

# Networks configuration
[[network]]
# The unique name of the network (Required)
key = 'cosmos_mainnet'
# The chain id (Required)
chain-id = 'cosmoshub-4'
# The coin type (Required). This default value for most cosmos based networks. Check the your network docs to provide the correct value
hd-path = "m/44'/118'/0'/0/0"
# denom (Required)
denom = 'uatom'
# Address prefix (Required)
prefix = 'cosmos'
# Decimals (Required)
decimals = 6
wallet-key = ['my_wallet']
# RPC endpoints (Required)
net = { rpc = ['https://rpc.cosmos.directory/cosmoshub'] }
# This will be used to create links to the block explorer. Links to proposals and trx result 
explorer = { proposal = 'https://www.mintscan.io/cosmos/proposals/:id', trx = 'https://www.mintscan.io/cosmos/txs/:hash' }
# Specify the transport to send notifications. Which is defined above (Required)
transport = 'telegram_cosmos_proposals'
`
