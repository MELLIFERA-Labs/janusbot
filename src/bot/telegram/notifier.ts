import { type KeyWithClient } from '../../services/network.service'
import { Bot } from 'grammy'
import { createStartVoteBtn } from './iline-menu/vote/menu/start-vote.menu'
import { type Notifier } from '../common/notifier'

interface TelegramConfig {
  BOT_TOKEN: string
  BOT_CHAT_ID: string
}

export class TelegramNotifier implements Notifier {
  keysWithClient: KeyWithClient[]
  config: TelegramConfig
  bot: Bot
  public type: string = 'telegram'
  constructor(config: TelegramConfig, keysWithClient: KeyWithClient[]) {
    this.config = config
    this.keysWithClient = keysWithClient
    this.bot = new Bot(config.BOT_TOKEN)
  }

  async sendMessage(message: string): Promise<void> {
    await this.bot.api.sendMessage(this.config.BOT_CHAT_ID, message, {
      reply_markup: createStartVoteBtn(),
      parse_mode: 'HTML',
    })
  }
}
