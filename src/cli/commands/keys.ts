import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing'
import { KEYS_FOLDER, BASE_DIR_DEFAULT } from '../../constants'
import password from '@inquirer/password'
import confirm from '@inquirer/confirm'
import path from 'path'
import { EnglishMnemonic } from '@cosmjs/crypto'
import cliLog from '../../services/cli-log.service'
import { FsService } from '../../services/fs.service'

// const writeIfNotExists = (path: string, data: string): boolean => {
//   if (!fs.existsSync(path)) {
//     fs.writeFileSync(path, data)
//     return true
//   }
//   return false
// }

export const addKeys = async (
  key: string,
  option: { recover?: boolean },
): Promise<void> => {
  const fsService = new FsService(BASE_DIR_DEFAULT)
  if (option.recover === true) {
    const mnemonic = await password({
      message: 'Enter your mnemonic',
      mask: true,
    })
    const mnemonicChecked = new EnglishMnemonic(mnemonic)
    fsService.createKeyRecord(key, {
      key: key.trim(),
      mnemonic: mnemonicChecked.toString(),
    })
    return
  }
  const { mnemonic } = await DirectSecp256k1HdWallet.generate(24)
  fsService.createKeyRecord(key, {
    key: key.trim(),
    mnemonic,
  })
}

export const deleteKey = async (key: string): Promise<void> => {
  const fsService = new FsService(BASE_DIR_DEFAULT)
  const isConfirm = await confirm({
    message: `Are you sure you want to delete the key "${key}"?`,
  })
  if (!isConfirm) return

  fsService.removeKey(key)
}

export const showKey = async (key: string): Promise<void> => {
  const fsService = new FsService(BASE_DIR_DEFAULT)
  const keyData = fsService.readKeyData(key)
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(keyData.mnemonic)
  const [account] = await wallet.getAccounts()
  cliLog.info(`key: ${key}`)
  cliLog.info(`cosmos address: ${account.address}`)
}

export const listKeys = async (): Promise<void> => {
  const pathToKeys = path.join(BASE_DIR_DEFAULT, KEYS_FOLDER)
  FsService.checkInitFolder(pathToKeys)
  const fsService = new FsService(BASE_DIR_DEFAULT)
  const keys = fsService.readAllKeys()
  keys.forEach((key, index) => {
    cliLog.info(`${index + 1}. ${key}`)
  })
}
