import { BASE_DIR_DEFAULT } from '../../constants'
import { FsService } from '../../services/fs.service'

export default async (): Promise<void> => {
  const fsService = new FsService(BASE_DIR_DEFAULT)
  fsService.createBaseFolder()
  fsService.createBaseConfigFile()
}
