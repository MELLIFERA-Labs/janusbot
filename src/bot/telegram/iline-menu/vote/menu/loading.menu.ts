import { InlineKeyboard } from 'grammy'

export function createLoadingBtn(): InlineKeyboard {
  return new InlineKeyboard().text('Loading...', 'loading')
}
