export class CommandError extends Error {
  constructor(message?: string) {
    super()
    this.name = 'CommandError'
    this.message = message ?? 'Something went wrong'
  }
}

export class InitError extends CommandError {
  constructor() {
    super()
    this.name = 'InitError'
    this.message =
      "Can't find init configuration, try to run `init` command first"
  }
}

export class AlreadyExist extends CommandError {
  constructor(entity: string) {
    super()
    this.name = 'AlreadyExist'
    this.message = `[${entity}] Already exist`
  }
}
