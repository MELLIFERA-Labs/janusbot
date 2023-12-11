import { Command } from 'commander'
import appInfo from '../package.json'
import intiCommand from './commands/init'
import { addKeys, deleteKey, listKeys, showKey } from './commands/keys'
import runBot from './commands/run-bot'
import { commandRunner } from './commands-error-handler'
const program = new Command()

program
  .name(appInfo.name)
  .description(appInfo.description)
  .version(appInfo.version)

program
  .command('init')
  .description('Initialize application configuration files')
  .action(commandRunner(intiCommand))

const keysCommand = program.command('keys')

keysCommand
  .command('add <key-wallet>')
  .description('Add new wallet')
  .option('-r, --recover', 'Recover wallet from mnemonic')
  .action(commandRunner(addKeys))

keysCommand
  .command('delete <walletKey>')
  .description('Delete the given keys')
  .action(commandRunner(deleteKey))

keysCommand.command('list').description('List all keys').action(listKeys)

keysCommand
  .command('show <walletKey>')
  .description('Show the given keys, the address will')
  .action(commandRunner(showKey))

const runCommand = program.command('run')

runCommand
  .command('start')
  .description('Start bot application')
  .action(commandRunner(runBot))

program.parse()
