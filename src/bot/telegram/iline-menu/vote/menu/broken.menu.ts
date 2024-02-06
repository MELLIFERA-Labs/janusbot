import { InlineKeyboard } from 'grammy'

export function createBrokenBtn(): InlineKeyboard {
  return new InlineKeyboard().text('Broken 😔', `broken`)
}
