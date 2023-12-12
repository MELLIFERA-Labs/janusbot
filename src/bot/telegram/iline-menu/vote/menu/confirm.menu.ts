import { InlineKeyboard, type Context } from 'grammy'

export function createConfirmMenu(ctx: Context, data: string): InlineKeyboard {
  return new InlineKeyboard()
    .text('confirm', ctx.registerMenuData('vote', data))
    .text('Cancel', ctx.registerMenuData('reset', data))
}
