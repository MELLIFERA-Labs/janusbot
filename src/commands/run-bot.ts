import toml from 'toml'
import { BASE_DIR_DEFAULT, CONFIG_FILE_NAME } from '../constants'
import path from 'path'
import fs from 'fs'
import { validateConfig, validateProcessConfig } from '../validate-config'
import { createNetworkProvider } from '../services/network.service'

export default async (): Promise<void> => {
  const configPath = path.join(BASE_DIR_DEFAULT, CONFIG_FILE_NAME)
  const tomlContent = fs.readFileSync(configPath, 'utf-8')
  const config = toml.parse(tomlContent)
  const isValid = validateConfig(config)
  if (!isValid.isValid) {
    console.log(`ERROR: ${isValid.errors}`)
    return
  }
  const isValidProcess = await validateProcessConfig(config)
  if (!isValidProcess.isValid) {
    console.log(`ERROR: ${isValidProcess.errors}`)
    return
  }
  const networkServices = await createNetworkProvider(config)
  const p = await networkServices[0].keys[0].queryClient.gov.proposals(
    2,
    '',
    '',
  )
  console.log(p.proposals[0].proposalId)
  console.log(new TextDecoder().decode(p.proposals[0].content?.value))
  console.log(p.proposals[0].content?.value)
  // init object with config
  console.log('start')
}
