import { describe, expect, it } from 'vitest'
import { normalizeTickers } from './tickers'
import { ApiError } from './errors'

describe('normalizeTickers', () => {
  it('prefixes bare symbols with the post exchange', () => {
    expect(normalizeTickers(['DANG', 'Glo'], 'NGX')).toEqual(['NGX:DANG', 'NGX:GLO'])
  })
  it('uppercases, dedupes, and keeps explicit prefixes', () => {
    expect(normalizeTickers(['ngx:dang', 'NGX:DANG', 'gse:NGG'], 'NGX')).toEqual(['NGX:DANG', 'GSE:NGG'])
  })
  it('rejects bare symbols when the post has no exchange', () => {
    try {
      normalizeTickers(['DANG'], null)
      expect.unreachable('should throw')
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError)
      expect((e as ApiError).status).toBe(400)
      expect((e as ApiError).message).toMatch('needs an exchange prefix')
    }
  })
  it('rejects unknown exchange prefixes', () => {
    try {
      normalizeTickers(['FOO:X'], 'NGX')
      expect.unreachable('should throw')
    } catch (e) {
      expect((e as ApiError).code).toBe('validation_error')
      expect((e as ApiError).status).toBe(400)
    }
  })
})