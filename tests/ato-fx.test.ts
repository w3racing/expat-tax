import { describe, expect, it } from 'vitest'
import {
  getAtoExchangeRate,
  listAtoCurrencies,
  lookupAtoRateForMonth,
} from '@/features/tax-position/engine/ato-fx'

/**
 * ATO FX reference — lookup only. Never mutates claim rates automatically.
 */
describe('ato exchange rates reference', () => {
  it('lists supported currencies', () => {
    const codes = listAtoCurrencies()
    expect(codes).toContain('USD')
    expect(codes).toContain('JPY')
    expect(codes).toContain('EUR')
  })

  it('returns units per A$1 for known month', () => {
    const rate = lookupAtoRateForMonth('USD', 2025, 7)
    expect(rate).not.toBeNull()
    expect(rate!.unitsPerAud).toBeGreaterThan(0)
    expect(rate!.sourceVersion).toBeTruthy()
  })

  it('returns null for unknown currency/month', () => {
    expect(getAtoExchangeRate('ZZZ', 2025, 7)).toBeUndefined()
  })
})
