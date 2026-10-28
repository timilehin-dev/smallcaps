import { describe, expect, it } from 'vitest'
import { slugify, withSuffix } from './slug'

const D = new Date('2026-07-15T10:00:00Z')

describe('slugify', () => {
  it('kebab-cases the title and appends YYYY-MM-DD', () => {
    expect(slugify('Hello World', D)).toBe('hello-world-2026-07-15')
  })
  it('strips diacritics (unicode normalization)', () => {
    expect(slugify('Eclectic Cafe', D)).toBe('eclectic-cafe-2026-07-15')
  })
  it('expands & to "and" and collapses punctuation', () => {
    expect(slugify('A & B -- C!!!', D)).toBe('a-and-b-c-2026-07-15')
  })
  it('caps the base at 80 chars and trims trailing dashes', () => {
    const s = slugify('a'.repeat(200), D)
    expect(s.slice(0, -11).length).toBe(80)
  })
  it('falls back to "post" when nothing survives', () => {
    expect(slugify('!!! ???', D)).toBe('post-2026-07-15')
  })
})

describe('withSuffix', () => {
  it('appends a 4-char random tail', () => {
    expect(withSuffix('x-2026-07-15')).toMatch(/^x-2026-07-15-[0-9a-z]{4}$/)
  })
})