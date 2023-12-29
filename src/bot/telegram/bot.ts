import { type NetworkService } from '../../services/network.service'
import { type DbService } from '../../services/db.service'
import { Context, Bot } from 'grammy'
import { iline } from './iline'
import { Config } from '../../types/config'
import { GrammyError, HttpError } from 'grammy';
import logger from '../../services/app-logger.service'
import { createStartVoteBtn } from './iline-menu/vote/menu/start-vote.menu'
import { autoRetry } from "@grammyjs/auto-retry";
import './iline-menu';

const log = logger('bot:telegram:client')
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
  bot.api.config.use(autoRetry());
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
    if (ctx?.callbackQuery.data)
      await iline.dispatchActionMenu(ctx, ctx.callbackQuery.data);
  });

  // error handler 
  bot.catch(async err => {
  const ctx = err.ctx;
  const e = err.error;
  log.error(e, `Error while handling update ${ctx.update.update_id}`);
  if (e instanceof GrammyError) {
    if (
      e.message.includes(
        "Call to 'editMessageReplyMarkup' failed! (400: Bad Request: message is not modified:",
      )
    )
      return;
    log.error(e, 'Error in request');
  } else if (e instanceof HttpError) {
    log.error(e, 'Could not contact Telegram');
  } else {
    log.error(e, 'Unknown error');
  }

  return ctx.editMessageReplyMarkup({
    reply_markup: createStartVoteBtn(),
  });
});
  bot.start()
}
