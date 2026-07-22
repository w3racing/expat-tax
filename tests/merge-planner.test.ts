import { describe, expect, it } from 'vitest'
import { emptyPlanner } from '@/features/tax-position/engine'
import { mergeById, mergePlannerStates } from '@/features/migration/utils/merge-planner'

describe('mergePlannerStates', () => {
  it('keeps existing claims when the backup lacks them', () => {
    const existing = emptyPlanner(2026)
    existing.years[0]!.otherClaims = [
      {
        id: 'keep-me',
        currencyCode: 'AUD',
        localAmount: 100,
        exchangeRate: 1,
        workPercentage: 100,
        description: 'Existing only',
      },
    ]

    const incoming = emptyPlanner(2026)
    incoming.years[0]!.otherClaims = [
      {
        id: 'new-me',
        currencyCode: 'AUD',
        localAmount: 50,
        exchangeRate: 1,
        workPercentage: 100,
        description: 'From backup',
      },
    ]

    const merged = mergePlannerStates(existing, incoming)
    const ids = merged.years[0]!.otherClaims.map((c) => c.id).sort()
    expect(ids).toEqual(['keep-me', 'new-me'])
  })

  it('updates matching ids from the backup without dropping others', () => {
    const existing = emptyPlanner(2026)
    existing.years[0]!.otherClaims = [
      {
        id: 'same',
        currencyCode: 'AUD',
        localAmount: 10,
        exchangeRate: 1,
        workPercentage: 100,
        description: 'Old',
      },
      {
        id: 'keep',
        currencyCode: 'AUD',
        localAmount: 1,
        exchangeRate: 1,
        workPercentage: 100,
      },
    ]

    const incoming = emptyPlanner(2026)
    incoming.years[0]!.otherClaims = [
      {
        id: 'same',
        currencyCode: 'JPY',
        localAmount: 5000,
        exchangeRate: 100,
        workPercentage: 100,
        description: 'Updated',
      },
    ]

    const merged = mergePlannerStates(existing, incoming)
    const same = merged.years[0]!.otherClaims.find((c) => c.id === 'same')
    expect(same?.description).toBe('Updated')
    expect(same?.currencyCode).toBe('JPY')
    expect(merged.years[0]!.otherClaims.some((c) => c.id === 'keep')).toBe(true)
  })

  it('mergeById preserves originals', () => {
    expect(mergeById([{ id: 'a' }, { id: 'b' }], [{ id: 'b' }, { id: 'c' }]).map((r) => r.id)).toEqual([
      'a',
      'b',
      'c',
    ])
  })
})
