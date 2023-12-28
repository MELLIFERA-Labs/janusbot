import { type KeyWithClient } from '../../services/network.service'
import { Bot } from 'grammy'
import { createStartVoteBtn } from './iline-menu/vote/menu/start-vote.menu'
import { type Notifier } from '../common/notifier'
import {TELEGRAM_TOKEN_ENV} from '../../constants'

interface TelegramConfig {
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
    this.bot = new Bot(process.env[TELEGRAM_TOKEN_ENV] ?? '')
  }

  async sendMessage(message: string): Promise<number> {
    const msg = await this.bot.api.sendMessage(this.config.BOT_CHAT_ID, message, {
      reply_markup: createStartVoteBtn(),
      parse_mode: 'HTML',
    })
    return msg.message_id
  }
}
