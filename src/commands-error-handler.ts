export class InitError extends Error {
  constructor() {
    super()
    this.name = 'InitError'
    this.message =
      "Can't find init configuration, try to run `init` command first"
  }
}
const commandsErrorHanlder = (error: Error): void => {
  if (error instanceof InitError) {
    console.log(error.message)
    return
  }
  console.error(error.message)
}

export const commandRunner =
  (fn: (...args: any[]) => Promise<any>) =>
  async (...args: any[]) => {
    return await fn(...args).catch(commandsErrorHanlder)
  }
