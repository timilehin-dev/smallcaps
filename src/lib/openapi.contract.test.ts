import { describe, expect, it } from 'vitest'
import { spec } from '@/app/openapi.json/route'
import { CATEGORIES, EXCHANGES, SENTIMENTS, STATUSES, createSchema } from './schemas'

/**
 * Drift guard: the served OpenAPI document and the zod schemas must agree on the field
 * names and enum members of the create payload. Keeps `openapi.json` honest as the API grows.
 */
describe('openapi <-> zod contract', () => {
  const input = spec.components.schemas.PostInput as {
    required: string[]
    properties: Record<string, { enum?: unknown[] }>
  }
  const zodKeys = Object.keys(createSchema.shape)
  const zodRequired = zodKeys.filter((k) => !createSchema.shape[k as keyof typeof createSchema.shape].isOptional())

  it('documents exactly the fields the create schema accepts', () => {
    expect(Object.keys(input.properties).sort()).toEqual(zodKeys.sort())
  })

  it('marks the same fields required', () => {
    expect([...input.required].sort()).toEqual([...zodRequired].sort())
  })

  it('agrees on the category enum', () => {
    expect(input.properties.category.enum).toEqual([...CATEGORIES])
  })

  it('agrees on the exchange enum (plus null)', () => {
    expect(input.properties.exchange.enum).toEqual([...EXCHANGES, null])
  })

  it('agrees on the sentiment enum (plus null)', () => {
    expect(input.properties.sentiment.enum).toEqual([...SENTIMENTS, null])
  })

  it('keeps the documented request shape strict', () => {
    expect((input as unknown as { additionalProperties: boolean }).additionalProperties).toBe(false)
  })

  it('exposes every implemented endpoint', () => {
    expect(Object.keys(spec.paths).sort()).toEqual(['/health', '/media', '/posts', '/posts/{ref}'])
  })

  it('documents the error contract once, consistently', () => {
    const err = spec.components.schemas.Error as { properties: { error: { required?: string[] } } }
    expect(err.properties.error).toBeTruthy()
    expect(STATUSES).toContain('retracted')
  })
})
