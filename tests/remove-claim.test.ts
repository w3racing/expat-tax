import { describe, expect, it } from 'vitest'
import { removeClaimById } from '@/features/quick-claim/utils/add-claim'
import { emptyTaxYear } from '@/features/tax-position/engine/summarize'

describe('removeClaimById', () => {
  it('removes a claim from any ledger by id and leaves others intact', () => {
    const year = emptyTaxYear(2027)
    year.apartmentCosts = [
      {
        id: 'rent-a',
        dateYmd: '2026-07-21',
        kind: 'rent',
        description: 'JULY Rent',
        localAmount: 285000,
        exchangeRate: 0,
      },
      {
        id: 'rent-b',
        dateYmd: '2026-07-21',
        kind: 'rent',
        description: 'rent',
        localAmount: 285000,
        exchangeRate: 0,
      },
    ]
    year.flights = [
      {
        id: 'flight-a',
        dateYmd: '2026-07-18',
        description: 'SYD-HND',
        currencyCode: 'AUD',
        localAmount: 300,
        exchangeRate: 1,
        workPercentage: 100,
      },
    ]
    year.laundry = [
      {
        id: 'laundry-a',
        dateYmd: '2026-06-01',
        description: 'Uniform',
        localAmount: 2000,
        exchangeRate: 97,
      },
    ]

    const next = removeClaimById(year, 'rent-b')

    expect(next.apartmentCosts.map((c) => c.id)).toEqual(['rent-a'])
    expect(next.flights).toHaveLength(1)
    expect(next.laundry).toHaveLength(1)
    expect(year.apartmentCosts).toHaveLength(2)
  })
})
