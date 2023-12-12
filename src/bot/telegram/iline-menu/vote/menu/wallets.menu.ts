import { InlineKeyboard } from 'grammy'

import { type ActionMenuCtx } from '../../../iline'

export function createWalletMenu(
  ctx: ActionMenuCtx,
  data: Array<{ name: string; _id: string }>,
): InlineKeyboard {
  const walletMenu = new InlineKeyboard()
  data.forEach((dataWallet) => {
    walletMenu
      .text(
        `Vote as: ${dataWallet.name}`,
        ctx.registerMenuData('select', dataWallet._id),
      )
      .row()
  })
  walletMenu.text('cancel', ctx.registerMenuData('reset'))
  return walletMenu
}
