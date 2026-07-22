import { describe, expect, it } from 'vitest'
import { fyMonthKeys, monthShortLabel } from '@/features/overnight-planner/utils/fy-months'
import {
  monthClaimAud,
  nightsAt,
  rateMapForFy,
  setNightsAt,
  yearClaimAud,
} from '@/features/overnight-planner/utils/overnight-matrix'
import { parseDailyRateInput, parseNightsInput } from '@/features/overnight-planner/utils/parse-nights'

describe('fyMonthKeys', () => {
  it('returns Jul–Jun for FY end year', () => {
    expect(fyMonthKeys(2026)).toEqual([
      '2025-07',
      '2025-08',
      '2025-09',
      '2025-10',
      '2025-11',
      '2025-12',
      '2026-01',
      '2026-02',
      '2026-03',
      '2026-04',
      '2026-05',
      '2026-06',
    ])
  })

  it('labels months', () => {
    expect(monthShortLabel('2025-07')).toBe('Jul')
    expect(monthShortLabel('2026-01')).toBe('Jan')
  })
})

describe('parseNightsInput', () => {
  it('accepts empty as zero', () => {
    expect(parseNightsInput('')).toEqual({ ok: true, nights: 0, display: '' })
  })

  it('accepts integers including Calculator-dense months', () => {
    expect(parseNightsInput('40')).toEqual({ ok: true, nights: 40, display: '40' })
  })

  it('rejects decimals and over max', () => {
    expect(parseNightsInput('1.5').ok).toBe(false)
    expect(parseNightsInput('100').ok).toBe(false)
  })
})

describe('parseDailyRateInput', () => {
  it('accepts money amounts', () => {
    expect(parseDailyRateInput('185.5')).toEqual({ ok: true, rate: 185.5, display: '185.5' })
  })

  it('rejects invalid', () => {
    expect(parseDailyRateInput('12.345').ok).toBe(false)
    expect(parseDailyRateInput('-1').ok).toBe(false)
  })
})

describe('overnight matrix', () => {
  it('sets and clears nights and calculates claims like Calculator', () => {
    let away = setNightsAt([], '2025-09', 'dest-japan', 40)
    away = setNightsAt(away, '2025-11', 'dest-thailand', 10)

    expect(nightsAt(away, '2025-09', 'dest-japan')).toBe(40)
    expect(nightsAt(away, '2025-11', 'dest-thailand')).toBe(10)

    const rates = rateMapForFy([
      { destinationId: 'dest-japan', dailyRateAud: 185 },
      { destinationId: 'dest-thailand', dailyRateAud: 140 },
    ])
    const ids = ['dest-japan', 'dest-thailand']

    expect(monthClaimAud(away, '2025-09', rates, ids)).toBe(40 * 185)
    expect(yearClaimAud(away, rates, ids)).toBe(40 * 185 + 10 * 140)

    away = setNightsAt(away, '2025-09', 'dest-japan', 0)
    expect(nightsAt(away, '2025-09', 'dest-japan')).toBe(0)
    expect(away.find((m) => m.destinationId === 'dest-japan')).toBeUndefined()
  })
})
