import { type NetworkService } from '../../services/network.service'
import { Bot } from 'grammy'

interface TelegramConfig {
  BOT_TOKEN: string
  BOT_CHAT_ID: string
}

export class TelegramNotifier {
  networkService: NetworkService
  config: TelegramConfig
  bot: Bot
  constructor(config: TelegramConfig, networkService: NetworkService) {
    this.config = config
    this.networkService = networkService
    this.bot = new Bot(config.BOT_TOKEN)
  }

  async sendMessage(message: string): Promise<void> {
    await this.bot.api.sendMessage(this.config.BOT_CHAT_ID, 'test')
  }
}
