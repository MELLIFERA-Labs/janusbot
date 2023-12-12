import { InlineKeyboard } from 'grammy'

import { type ActionMenuCtx } from '../../../iline'

export function createSelectVote(
  ctx: ActionMenuCtx,
  select: string | null,
  wallet: string,
): InlineKeyboard {
  const checker = (type: string): string =>
    select === type && select !== null ? '✅' : ''
  return new InlineKeyboard()
    .text(
      `Yes ${checker('yes')}`,
      ctx.registerMenuData('confirm', `yes:${wallet}`),
    )
    .text(
      `No ${checker('no')}`,
      ctx.registerMenuData('confirm', `no:${wallet}`),
    )
    .row()
    .text(
      `No with veto ${checker('no_with_veto')}`,
      ctx.registerMenuData('confirm', `no_with_veto:${wallet}`),
    )
    .text(
      `Abstain ${checker('abstain')}`,
      ctx.registerMenuData('confirm', `abstain:${wallet}`),
    )
    .row()
    .text('cancel', ctx.registerMenuData('reset'))
}
