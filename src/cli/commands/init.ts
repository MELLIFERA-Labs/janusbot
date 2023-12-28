import {
  BASE_DIR_DEFAULT,
  CONFIG_FILE_NAME,
} from '../../constants'
import { FsService } from '../../services/fs.service'

export default async (): Promise<void> => {
  const fsService = new FsService(BASE_DIR_DEFAULT)
  fsService.createBaseFolder()
  fsService.createBaseConfigFile()
}
