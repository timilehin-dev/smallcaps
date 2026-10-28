import { ApiError } from './errors'
import { EXCHANGES } from './schemas'

/** Normalise tickers to "EXCHANGE:SYMBOL", upper-case and de-duplicated. */
export function normalizeTickers(input: string[], exchange: string | null | undefined): string[] {
  const out = new Set<string>()
  for (const raw of input) {
    const t = raw.trim().toUpperCase()
    const [prefix, symbol] = t.includes(':') ? t.split(':') : [exchange ?? null, t]
    if (!prefix) {
      throw new ApiError(
        400,
        'validation_error',
        `Ticker "${raw}" needs an exchange prefix (e.g. "NGX:${t}") or the post must set "exchange".`,
      )
    }
    if (!(EXCHANGES as readonly string[]).includes(prefix)) {
      throw new ApiError(400, 'validation_error', `Unknown exchange "${prefix}" in ticker "${raw}".`)
    }
    out.add(`${prefix}:${symbol}`)
  }
  return [...out]
}
