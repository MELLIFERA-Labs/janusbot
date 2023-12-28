import { InlineKeyboard } from 'grammy'

import { type ActionMenuCtx } from '../../../iline'

export function createWalletMenu(
  ctx: ActionMenuCtx,
  data: Array<string>,
): InlineKeyboard {
  const walletMenu = new InlineKeyboard()
  data.forEach((walletKey) => {
    walletMenu
      .text(
        `Vote as: ${walletKey}`,
        ctx.registerMenuData('select', walletKey),
      )
      .row()
  })
  walletMenu.text('cancel', ctx.registerMenuData('reset'))
  return walletMenu
}
