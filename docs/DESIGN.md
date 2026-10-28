# DESIGN.md — FrontierCap placeholder design system

Status: **Phase C placeholder.** Intentionally restrained: one accent color, system font
stack, card-based lists, generous whitespace. Dark mode is a P2 item, not part of launch.

## Foundations
- Background: white; text: neutral-900; secondary text: neutral-500/600/700.
- Single accent: `--color-accent: #0b4f8a` (deep editorial blue) — links, category labels,
  chip borders. No second brand color at launch.
- Font: system/Inter stack from `@theme --font-sans` in `src/app/globals.css` (Tailwind 4).
- Body column: `max-w-5xl` for lists, `max-w-3xl` for article reading width.

## Components
- **Header**: wordmark `Frontier` + accent `Cap`; nav: News / Market Wraps / Research /
  Macro Radar / Search / About. Mobile: wraps (`flex-wrap`).
- **PostCard**: 1px neutral border, rounded-xl, category label + exchange chip +
  exchange-localised date, title (linked), excerpt, TickerChips.
- **TickerChips**: pill links `EXCH · SYM` → `/ticker/<ex>/<sym>`.
- **MetricsTable**: bordered, `tabular-nums`; delta color is restrained:
  positive green-700, negative red-700, flat neutral-500 (see `deltaClass`).
- **Markdown**: Tailwind typography `prose prose-neutral`; HTML skipped; images only
  from our Blob host; external links `rel="noopener noreferrer"`.
- **Disclaimer**: auto-appended to every post page (amber-tinted retract banner on
  retracted articles, `role="alert"`).

## Time & locale
- All timestamps render in the post's exchange time zone (Lagos/Accra/Nairobi), stored UTC.
- `en-GB` medium date style.

## SEO / metadata
- JSON-LD Article on post pages (escaped `</` sequences), canonical URLs,
  OG + Twitter cards, RSS at `/feed.xml` (published posts only), `/sitemap.xml`,
  `/robots.txt` (disallow `/api/`). Retracted posts are noindex and excluded from
  index/feed/search.

## Accessibility (WCAG 2.2 AA targets)
- Semantic landmarks (header/nav/main/footer), single h1 per page, visible focus styles
  (browser default preserved), color contrast neutral-700-on-white (7.5:1),
  alt text on all images, `role="alert"` for retract banners.

## P2 (out of scope for launch)
- Dark mode, hero imagery, print styles, i18n beyond English.