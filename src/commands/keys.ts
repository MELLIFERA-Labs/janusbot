import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing'
import { KEYS_FOLDER, BASE_DIR_DEFAULT } from '../constants'
import password from '@inquirer/password'
import confirm from '@inquirer/confirm'
import path from 'path'
import fs from 'fs'
import { EnglishMnemonic } from '@cosmjs/crypto'
import { checkInitFolder } from '../utils'

const writeIfNotExists = (path: string, data: string): boolean => {
  if (!fs.existsSync(path)) {
    fs.writeFileSync(path, data)
    return true
  }
  return false
}

export const addKeys = async (
  key: string,
  option: { recover?: boolean },
): Promise<void> => {
  const pathToKeys = path.join(BASE_DIR_DEFAULT, KEYS_FOLDER)
  const createKeyRecord = (pathToKey: string, key: string, data: any): void => {
    const isCreated = writeIfNotExists(
      path.join(pathToKey, `${key.trim()}.json`),
      JSON.stringify(data),
    )
    if (!isCreated) {
      console.log(`ERROR: key "${key}" already exists`)
      return
    }
    console.log(`Created key "${key}"`)
  }
  checkInitFolder(pathToKeys)
  if (option.recover === true) {
    const mnemonic = await password({
      message: 'Enter your mnemonic',
      mask: true,
    })
    const mnemonicChecked = new EnglishMnemonic(mnemonic)
    createKeyRecord(pathToKeys, key, {
      key: key.trim(),
      mnemonic: mnemonicChecked.toString(),
    })
    return
  }
  const { mnemonic } = await DirectSecp256k1HdWallet.generate(24)

  createKeyRecord(pathToKeys, key, {
    key: key.trim(),
    mnemonic,
  })
}

export const deleteKey = async (key: string): Promise<void> => {
  const pathToKeys = path.join(BASE_DIR_DEFAULT, KEYS_FOLDER)
  checkInitFolder(pathToKeys)
  const pathToKey = path.join(pathToKeys, `${key.trim()}.json`)
  if (!fs.existsSync(pathToKey)) {
    console.log(`ERROR: key "${key}" not found`)
    return
  }
  const isConfirm = await confirm({
    message: `Are you sure you want to delete the key "${key}"?`,
  })
  if (!isConfirm) return

  fs.unlinkSync(pathToKey)

  console.log(`Key "${key}" deleted forever!`)
}

export const showKey = async (key: string): Promise<void> => {
  const pathToKeys = path.join(BASE_DIR_DEFAULT, KEYS_FOLDER)
  checkInitFolder(pathToKeys)
  const pathToKey = path.join(pathToKeys, `${key.trim()}.json`)
  if (!fs.existsSync(pathToKey)) {
    console.log(`ERROR: key "${key}" not found`)
    return
  }
  const keyData = JSON.parse(fs.readFileSync(pathToKey, 'utf-8'))
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(keyData.mnemonic)
  const [account] = await wallet.getAccounts()
  console.log(`key: ${key}`)
  console.log(`cosmos address: ${account.address}`)
}

export const listKeys = async (): Promise<void> => {
  const pathToKeys = path.join(BASE_DIR_DEFAULT, KEYS_FOLDER)
  checkInitFolder(pathToKeys)
  const keys = fs.readdirSync(pathToKeys)
  keys.forEach((key, index) => {
    console.log(`${index + 1}. ${key.split('.')[0]}`)
  })
}
