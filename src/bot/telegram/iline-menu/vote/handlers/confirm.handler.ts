import { type CtxHandler } from '../../../iline'
import { createConfirmMenu } from '../menu/confirm.menu'

export function confirmHandler() {
  return async (req: CtxHandler) => {
    await req.ctx.editMessageReplyMarkup({
      reply_markup: createConfirmMenu(req.ctx, req.data),
    })
  }
}
