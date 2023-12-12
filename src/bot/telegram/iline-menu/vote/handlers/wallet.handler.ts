import { type CtxHandler } from '../../../iline'
import { getUserIdFromCtx } from '../../../lib/helper'
import { createWalletMenu } from '../menu/wallets.menu'
import {
  getGetSubsByUserIdAndNetwork,
  getMessageById,
} from '../services/resource'

export function walletHandler() {
  return async (req: CtxHandler) => {
    const msg = await getMessageById(req.ctx?.msg?.message_id)
    // todo: use custom error
    if (!msg) throw new Error('Message not found')
    const subs = await getGetSubsByUserIdAndNetwork(
      getUserIdFromCtx(req.ctx),
      msg.network_key,
    )
    if (!subs?.length) {
      await req.ctx.resetWithText('You have no subscriptions')
      return
    }
    const walletsData = subs.map((sub) => ({
      name: sub.name,
      _id: sub._id,
    }))
    await req.ctx.editMessageReplyMarkup({
      reply_markup: createWalletMenu(req.ctx, walletsData),
    })
  }
}
