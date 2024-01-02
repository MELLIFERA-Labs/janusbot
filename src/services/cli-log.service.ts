import chalk from 'chalk'

export default {
  error: (message: string) => {
    console.log(`${chalk.red('error: ')}${message}`)
  },
  success: (message: string) => {
    console.log(`${chalk.green('success: ')}${message}`)
  },
  warn: (message: string) => {
    console.log(`${chalk.yellow('warn: ')}${message}`)
  },
  info: (message: string) => {
    console.log(`${chalk.cyan(message)}`)
  },
}
