import { EXCHANGE_TZ } from './site'
import type { Exchange } from './schemas'

export function fmtDate(d: Date, exchange?: Exchange | null, withTime = false): string {
  return new Intl.DateTimeFormat('en-GB', {
    dateStyle: 'medium',
    ...(withTime && { timeStyle: 'short' as const }),
    timeZone: exchange ? EXCHANGE_TZ[exchange] : 'Africa/Lagos',
  }).format(d)
}

export function deltaClass(delta: unknown): string {
  const s = String(delta ?? '').trim()
  if (/^[+]?\d/.test(s) && !/^0+(\.0+)?%?$/.test(s)) return 'text-emerald-700'
  if (/^[-−–]/.test(s)) return 'text-red-700'
  return 'text-neutral-500'
}

export function tickerParts(t: string): { exchange: string; symbol: string } {
  const [exchange, symbol] = t.split(':')
  return { exchange, symbol }
}

export function tickerHref(t: string): string {
  const { exchange, symbol } = tickerParts(t)
  return `/ticker/${exchange.toLowerCase()}/${encodeURIComponent(symbol.toLowerCase())}`
}
