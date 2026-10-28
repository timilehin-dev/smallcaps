import type { Category, Exchange } from './schemas'

export const SITE_NAME = 'FrontierCap'
export const TAGLINE = 'Independent small-cap research for NGX, GSE and NSE'

export function siteUrl(): string {
  const explicit = process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL
  if (explicit) return explicit.replace(/\/+$/, '')
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL
  return vercel ? `https://${vercel}` : 'http://localhost:3000'
}

export const SECTIONS = {
  news: { category: 'news_brief', title: 'News', blurb: 'Short, sourced briefs on the stories moving African small caps.' },
  'market-wraps': { category: 'market_wrap', title: 'Market Wraps', blurb: 'Daily wraps for the Nigerian, Ghanaian and Kenyan exchanges.' },
  research: { category: 'equity_analysis', title: 'Research', blurb: 'In-depth equity analysis of listed small-cap companies.' },
  macro: { category: 'macro_radar', title: 'Macro Radar', blurb: 'Rates, currencies and policy that matter for local equities.' },
} as const satisfies Record<string, { category: Category; title: string; blurb: string }>

export type SectionKey = keyof typeof SECTIONS

export const CATEGORY_LABEL: Record<Category, string> = {
  news_brief: 'News',
  market_wrap: 'Market Wrap',
  equity_analysis: 'Research',
  macro_radar: 'Macro Radar',
}

export const CATEGORY_SECTION: Record<Category, SectionKey> = {
  news_brief: 'news',
  market_wrap: 'market-wraps',
  equity_analysis: 'research',
  macro_radar: 'macro',
}

export const EXCHANGE_TZ: Record<Exchange, string> = {
  NGX: 'Africa/Lagos',
  GSE: 'Africa/Accra',
  NSE: 'Africa/Nairobi',
}

export const EXCHANGE_NAME: Record<Exchange, string> = {
  NGX: 'Nigerian Exchange',
  GSE: 'Ghana Stock Exchange',
  NSE: 'Nairobi Securities Exchange',
}

export const DISCLAIMER =
  'FrontierCap publishes information and research for educational and informational purposes only. It is not investment advice, a recommendation, or an offer to buy or sell any security. Markets involve risk, including loss of capital. Do your own research and consult a licensed adviser.'
