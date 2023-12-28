import fs from 'fs'
import { join } from 'path'
import { InitError, AlreadyExist } from '../errors'
import { CONFIG_FILE_DEFAULT_CONTENT, CONFIG_FILE_NAME, DB_FOLDER, KEYS_FOLDER } from '../constants'
import cliLog from './cli-log.service'
import chalk from 'chalk'

export class FsService {
  public basePath: string;
  constructor(path: string) {
    this.basePath = path;
  }
  static createFolderIfNotExists(path: string): void {
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path)
    }
  }
  createBaseFolder() {
    FsService.createFolderIfNotExists(this.basePath)
    cliLog.success(`Init BASE folder -> ${this.basePath}`)
    FsService.createFolderIfNotExists(join(this.basePath, DB_FOLDER))
    cliLog.success('Init DB folder')
    FsService.createFolderIfNotExists(join(this.basePath, KEYS_FOLDER))
    cliLog.success('Init KEYS folder')
  }

  createBaseConfigFile() {
    this.createFileIfNotExists(join(this.basePath, CONFIG_FILE_NAME), CONFIG_FILE_DEFAULT_CONTENT)
    cliLog.success('Init base Config')
  }

  createKeyRecord(key: string, keyData: {
    mnemonic: string,
    key: string
  }) {
    const pathToKeys = join(this.basePath, KEYS_FOLDER)
    FsService.checkInitFolder(pathToKeys)
    this.createFileIfNotExists(join(pathToKeys, `${key}.json`), JSON.stringify(keyData))
    cliLog.success(`created key "${chalk.blue.underline.bold(key)}"`)
  }

  removeKey(key: string) {
    const pathToKeys =  join(this.basePath, KEYS_FOLDER)
    FsService.checkInitFolder(pathToKeys)
    const pathToKey = join(pathToKeys, `${key.trim()}.json`)
   
    if (!fs.existsSync(pathToKey)) {
      cliLog.error(`key "${key}" not found`)
      return process.exit(1)
    }
    fs.unlinkSync(pathToKey)
    cliLog.warn(`key "${key}" deleted forever :(`)
  }

  createFileIfNotExists(path: string, content: string): void {
    if (!fs.existsSync(path)) {
      fs.writeFileSync(path, content, 'utf8')
      return;
    }
    throw new AlreadyExist(path)
  }
  readKeyData(key: string): { key: string, mnemonic: string } {
    const pathToKeys = join(this.basePath, KEYS_FOLDER)
    FsService.checkInitFolder(pathToKeys)
    const pathToKey = join(pathToKeys, `${key.trim()}.json`)
    if (!fs.existsSync(pathToKey)) {
      cliLog.error(`key "${key}" not found`)
      return process.exit(1)
    }
    const keyData = JSON.parse(fs.readFileSync(pathToKey, 'utf-8')) as { key: string, mnemonic: string }
    return keyData
  }

  readAllKeys(): string[] {
    const pathToKey = join(this.basePath, KEYS_FOLDER)
    const keys = fs.readdirSync(pathToKey)
    return keys.map(item => item.split('.')[0])
  }
  static checkInitFolder(path: string): void {
    if (!fs.existsSync(path)) {
      throw new InitError()
    }
  }
}
