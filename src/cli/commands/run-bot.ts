import toml from 'toml'
import { BASE_DIR_DEFAULT, CONFIG_FILE_NAME, DB_FOLDER } from '../../constants'
import path from 'path'
import fs from 'fs'
import { validateProcessConfig } from '../../validate-config'
import { createNetworkProvider } from '../../services/network.service'
import { excuteWorker } from '../../bot/telegram/worker'
import { DbService } from '../../services/db.service'
import {Config} from '../../types/config'
import { startBot } from '../../bot/telegram/bot'
import { CommandError } from '../../errors'

export default async (): Promise<void> => {
  const configPath = path.join(BASE_DIR_DEFAULT, CONFIG_FILE_NAME)
  const tomlContent = fs.readFileSync(configPath, 'utf-8')
  const config:Config  = toml.parse(tomlContent)
  config.network.map((network) => network.key)  
  const dbService = new DbService(
    path.join(BASE_DIR_DEFAULT, DB_FOLDER),
    config.network.map((network) => network.key)
  )

  const isValidProcess = await validateProcessConfig(config)
  if (!isValidProcess.isValid || !isValidProcess.config) {
    throw new CommandError(isValidProcess.errors)
  }
  const networkServices = await createNetworkProvider(isValidProcess.config)
  
  await startBot(config, networkServices, dbService)
  await excuteWorker(networkServices, dbService)
  
}
