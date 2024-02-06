import { type CtxHandler } from '../../../iline'
import { createWalletMenu } from '../menu/wallets.menu'
import { getJanusMessageEntity } from '../../../utils/stateless-text'
export function walletHandler() {
  return async (req: CtxHandler) => {
    const networkKey = getJanusMessageEntity(req.ctx)

    if (!networkKey) {
      await req.ctx.resetWithText('Can not find network key')
      return
    }
    const store = req.ctx.services.dbService.getStore(networkKey)
    const message = store.data[`msg:${req!.ctx!.msg!.message_id}`]
    if (!message) {
      await req.ctx.resetWithText('Can not find message')
      return
    }
    const networkService = req.ctx.services.networkServices.find(
      (network) => network.networkKey === networkKey,
    )
    if (!networkService) {
      await req.ctx.resetWithText('Can not find wallets')
      return
    }

    const walletKyes = networkService.keys.map((k) => k.key)

    await req.ctx.editMessageReplyMarkup({
      reply_markup: createWalletMenu(req.ctx, walletKyes),
    })
  }
}
