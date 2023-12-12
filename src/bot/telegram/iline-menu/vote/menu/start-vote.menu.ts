import { InlineKeyboard } from 'grammy'

import { DELIMITER } from '../../../iline'
export function createStartVoteBtn(): InlineKeyboard {
  return new InlineKeyboard().text(
    'Vote',
    `start_vote${DELIMITER}${Date.now().toString()}`,
  )
}
