import { CommandError } from '../errors'
import cliLog from '../services/cli-log.service'

const commandsErrorHanlder = (error: Error): void => {
  if (error instanceof CommandError) {
    cliLog.error(error.message)
    return process.exit(1)
  }
  console.error(error)
  return process.exit(1)
}

type Args = [key: string, option: { recover?: boolean | undefined }]
export const commandRunner =
  (fn: (...args: Args) => Promise<void>) =>
  async (...args: Args) => {
    return await fn(...args).catch(commandsErrorHanlder)
  }
