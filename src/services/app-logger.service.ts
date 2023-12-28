import pino from 'pino'
export default function (name: string) {
  if (Bun.env.NODE_ENV === 'development') {
    return pino({ name, transport: { target: 'pino-pretty' } })
  }
  return pino({ name })
}
