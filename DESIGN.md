# FrontierCap — design system (v1)

Owner iterates on visual design after v1. Keep this file as the single source of truth for
tokens so later changes stay coherent.

## Principles

- Credible over flashy. This is a research publication, not a marketing site.
- Content first: generous whitespace, one accent, no illustrations, no gradients.
- Mobile-first. Everything must read well at 360px.
- Fast: static/ISR pages, system font stack, no client-side JS except search.

## Colour

| Token | Value | Use |
|-------|-------|-----|
| `--color-accent` | `#0b4f8a` | Links, section labels, active nav. The only brand colour. |
| Surface | `#ffffff` | Page background. |
| Text | `neutral-900` (`#171717`) | Body copy. |
| Muted text | `neutral-500` / `neutral-600` | Metadata, timestamps, captions. |
| Border | `neutral-200` | Card and table borders. |
| Positive delta | `emerald-700` | Upward metric change only. |
| Negative delta | `red-700` | Downward metric change only. |
| Warning surface | `amber-50` / `amber-300` | "Illustrative sample" banner. |
| Danger surface | `red-50` / `red-300` | Retraction / correction banner. |

Green and red are reserved strictly for numeric deltas and the retraction banner. Never use
them decoratively.

## Typography

System/Inter stack (`--font-sans`). No webfont download.

| Role | Classes |
|------|---------|
| Page title (post) | `text-3xl sm:text-4xl font-bold tracking-tight` |
| Section heading | `text-xl font-semibold tracking-tight` |
| Card title | `text-lg font-semibold tracking-tight` |
| Body | `text-base`, `prose prose-neutral` inside posts |
| Metadata | `text-xs text-neutral-500` |
| Label | `text-xs font-semibold uppercase tracking-wide text-accent` |

## Spacing and layout

- Container: `mx-auto max-w-5xl px-4` for lists; `max-w-3xl` for reading (post, about, disclaimer).
- Vertical rhythm: `space-y-12` between homepage sections, `mt-8`/`mt-10` between post blocks.
- Card grid: `grid gap-4 sm:grid-cols-2`.

## Components

- **Card** (`PostCard`): `rounded-xl border border-neutral-200 p-5`, hover border darkens to
  `neutral-300`. No shadow. Hero variant is `large` (`sm:p-8`, larger title).
- **Chips** (`TickerChips`): `rounded-full border border-neutral-200 px-2 py-0.5 text-xs`,
  accent text; label rendered as `EXCHANGE · SYMBOL`.
- **Metrics table** (`MetricsTable`): bordered, `overflow-x-auto`, right-aligned tabular
  numerals, change column colour-coded by `deltaClass`.
- **Markdown tables**: wrapped in `overflow-x-auto` so wide GFM tables scroll instead of
  breaking the layout. Header row `bg-neutral-50`.
- **Disclaimer**: `rounded-lg border bg-neutral-50` aside at the foot of every post.
- **Banners**: full-width, colour-bordered blocks at the top of the post body (sample =
  amber, retracted = red).

## Accessibility (WCAG 2.2 AA)

- Colour contrast: accent `#0b4f8a` on white ≈ 8.6:1 (AAA for normal text).
- Semantic landmarks: `<header>`, `<nav aria-label>`, `<main>`, `<footer>`, `<article>`.
- Retraction banner uses `role="alert"`; it is the first thing a screen reader reaches.
- All interactive elements are real links or form controls with accessible names
  (`aria-label` on search, `aria-label` on pagination nav).
- Visible focus is the browser default (no `outline: none` anywhere).
- No information conveyed by colour alone: deltas show a signed number, not just red/green.
- Images from Markdown require alt text (non-Blob images degrade to their alt string).
