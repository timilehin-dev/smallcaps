# Playbook: SEO and accessibility

Project-local substitute for the `seo-check`, `generate-schema` and `accessibility-audit`
plugins.

## SEO checklist
- [x] SSR/ISR everywhere; semantic HTML (`article`, `header`, `nav`, `main`, `footer`).
- [x] Unique `<title>` and `<meta name="description">` per page, from the excerpt.
- [x] Canonical URL on every page (`alternates.canonical`).
- [x] OpenGraph + Twitter card meta on post pages.
- [x] JSON-LD `Article` on post pages; `<` escaped in the serialised JSON.
- [x] `/sitemap.xml`, `/robots.txt` (`Disallow: /api/`), `/feed.xml` (published only).
- [x] Retracted posts excluded from feed/sitemap/lists and marked `noindex`.
- [ ] Post-launch: verify the domain in Google Search Console, submit the sitemap.

## Accessibility checklist (WCAG 2.2 AA)
- [x] Accent `#0b4f8a` on white ≈ 8.6:1 contrast.
- [x] Landmarks and heading order are logical.
- [x] Retraction banner is `role="alert"` and appears first in the post.
- [x] Interactive elements have accessible names; focus outline left at browser default.
- [x] No information by colour alone (deltas carry a signed value).
- [x] GFM tables scroll horizontally rather than breaking layout.
