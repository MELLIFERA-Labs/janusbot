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
# transports configuration
[[transport]]
# The unique name of the transport
key = 'main_telegram'
# transport type 
type = 'telegram'
# telegram bot token from environment variable
bot-token = 'env.TELEGRAM_BOT_TOKEN'
# telegram chat id from environment variable
chat-id = 'env.TELEGRAM_CHAT_ID'

# Networks configuration
[[network]]
# The unique name of the network (Required)
key = 'cosmos_mainnet'
# The chain id (Required)
chain-id = 'cosmoshub-4'
# required
hd-path = "m/44'/118'/0'/0/0"
# denom 
denom = 'uatom'
# You needd spacify one of the required points of connection to the network, that need to get proposals and votes
# rpc = ''
# lava = ''
`
