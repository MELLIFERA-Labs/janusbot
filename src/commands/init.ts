import fs from 'fs'
import path from 'path'
import {
  BASE_DIR_DEFAULT,
  CONFIG_FILE_DEFAULT_CONTENT,
  CONFIG_FILE_NAME,
  KEYS_FOLDER,
  DB_FOLDER,
} from '../constants'

const createFolderIfNotExists = (path: string): void => {
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path)
  }
}

export default async (): Promise<void> => {
  createFolderIfNotExists(BASE_DIR_DEFAULT)
  console.log(`Created base folder "${BASE_DIR_DEFAULT}" for Janus`)
  fs.writeFileSync(
    path.join(BASE_DIR_DEFAULT, CONFIG_FILE_NAME),
    CONFIG_FILE_DEFAULT_CONTENT,
  )
  console.log(
    `Created base config file "${BASE_DIR_DEFAULT}/${CONFIG_FILE_NAME}" for Janus`,
  )
  createFolderIfNotExists(`${BASE_DIR_DEFAULT}/${KEYS_FOLDER}`)
  console.log(
    `Created keys folder "${BASE_DIR_DEFAULT}/${KEYS_FOLDER}" for Janus`,
  )
  createFolderIfNotExists(`${BASE_DIR_DEFAULT}/${DB_FOLDER}`)
  console.log(`Created db forlder "${BASE_DIR_DEFAULT}/${DB_FOLDER}" for Janus`)
}
