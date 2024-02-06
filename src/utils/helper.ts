import { FETCH_REQUEST_TIMEOUT } from '../constants'
import path from 'path'
export function urlResolve(from: string, to: string): string {
  const resolvedUrl = new URL(to, new URL(from, 'resolve://'))
  if (resolvedUrl.protocol === 'resolve:') {
    // `from` is a relative URL.
    const { pathname, search, hash } = resolvedUrl
    return pathname + search + hash
  }
  return path.posix.join(from, to).replace(':/', '://')
}

type fetchWithTimeoutInit = Omit<RequestInit, 'signal'> & { timeout?: number }

export async function fetchWithTimeout(
  resource: string | URL | Request,
  options: fetchWithTimeoutInit = {},
): Promise<ReturnType<typeof fetch>> {
  const { timeout = FETCH_REQUEST_TIMEOUT } = options
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeout)
  const response = await fetch(resource, {
    ...options,
    signal: controller.signal,
  })
  clearTimeout(id)

  return response
}
