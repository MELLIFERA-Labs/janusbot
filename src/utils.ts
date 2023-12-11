import fs from 'fs'
import { InitError } from './commands-error-handler'

export const checkInitFolder = (path: string): void => {
  if (!fs.existsSync(path)) {
    throw new InitError()
  }
}
