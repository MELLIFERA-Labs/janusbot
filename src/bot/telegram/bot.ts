import { type NetworkService } from '../../services/network.service'
import { type DbService } from '../../services/db.service'
import { Context, Bot } from 'grammy'
import { iline } from './iline'
import { Config } from '../../types/config'
import './iline-menu';
interface Services {
  networkServices: NetworkService[]
  dbService: DbService
  config: Config
}
export type AppContext = Context & {
  services: Services 
}
export const startBot = async (config: Config, netoworkServices: NetworkService[], dbService: DbService): Promise<void> => {
  const bot = new Bot<AppContext>(process.env.TELEGRAM_BOT_TOKEN || '');
  // set services 
  bot.use(async (ctx, next) => {
    ctx.services = {
      networkServices: netoworkServices,
      dbService,
      config
    }
    await next();  
  })
  
  // todo: add protection to process messages only from allowed users 
  bot.on('callback_query:data', async ctx => {
    console.log(ctx?.callbackQuery.data)
    if (ctx?.callbackQuery.data)
      await iline.dispatchActionMenu(ctx, ctx.callbackQuery.data);
  });
  bot.start()
}
