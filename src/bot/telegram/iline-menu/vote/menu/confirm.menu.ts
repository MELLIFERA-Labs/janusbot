import { InlineKeyboard } from 'grammy'
import { type ActionMenuCtx } from '../../../iline'

export function createConfirmMenu(
  ctx: ActionMenuCtx,
  data: string,
): InlineKeyboard {
  return new InlineKeyboard()
    .text('confirm', ctx.registerMenuData('vote', data))
    .text('Cancel', ctx.registerMenuData('reset', data))
}
