import { Context as BaseContext } from 'grammy'
import { html } from 'telegram-format'
const URL_TEXT = '\u200C'
const BASE_URL = 'http://t.me/#'
const URL_SEPERATOR = '#'
const SUFFIX = 'janusbot'
function url(identifier: string, additionalState: string | undefined): string {
  return encodeURI(
    BASE_URL + identifier + URL_SEPERATOR + (additionalState ?? ''),
  )
}
export const suffixStatelessHTML = (
  identifier: string,
  additionalState: string | undefined,
): string => {
  return html.url(URL_TEXT, url(identifier, additionalState))
}
export const getMessageEntity = (
  context: BaseContext,
  identifier: string,
): string | null => {
  const entities = context.entities('text_link')
  const relevantEntity = entities.slice(-1).find((o) => o.type === 'text_link')

  const expectedUrl = url(identifier, undefined)
  if (!relevantEntity) {
    return null
  }
  const part = relevantEntity.url.slice(expectedUrl.length)
  if (!relevantEntity?.url.startsWith(expectedUrl)) {
    return null
  }

  return part
}

export const suffixJanusStatelessHTML = (identifier: string) =>
  suffixStatelessHTML(SUFFIX, identifier)
export const getJanusMessageEntity = (context: BaseContext) =>
  getMessageEntity(context, SUFFIX)
