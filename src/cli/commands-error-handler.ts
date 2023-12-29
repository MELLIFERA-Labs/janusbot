import { CommandError } from "../errors"
import cliLog from '../services/cli-log.service'

const commandsErrorHanlder = (error: Error): void => {
  if (error instanceof CommandError) {
    cliLog.error(error.message)
    return process.exit(1)
  }
  console.error(error)
  return process.exit(1)
}

export const commandRunner =
  (fn: (...args: any[]) => Promise<any>) =>
  async (...args: any[]) => {
    return await fn(...args).catch(commandsErrorHanlder)
  }
