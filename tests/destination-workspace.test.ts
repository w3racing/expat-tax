import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  averageDailySpendAud,
  computeReceiptAud,
  normalizeSampleDay,
  sampleDayTotalAud,
  type SampleDay,
} from '@/features/destination-workspace/types/sample-day'
import { buildDestinationStats } from '@/features/destination-workspace/utils/destination-stats'
import { calculateDestinationAverage } from '@/features/destination-workspace/utils/destination-average-calc'
import {
  addReceipt,
  createSampleDay,
  duplicateReceipt,
} from '@/features/destination-workspace/services/sample-day-store'

function day(partial: Partial<SampleDay> & Pick<SampleDay, 'id' | 'status'>): SampleDay {
  return normalizeSampleDay({
    id: partial.id,
    destinationId: 'au',
    fyEndYear: 2026,
    label: partial.label ?? 'Day',
    status: partial.status,
    notes: partial.notes ?? '',
    receipts: partial.receipts ?? [],
    linkedEvidenceIds: partial.linkedEvidenceIds ?? [],
    completedAt: partial.completedAt ?? null,
    createdAt: '2025-09-01T00:00:00.000Z',
    updatedAt: '2025-09-01T00:00:00.000Z',
  })
}

describe('sample day receipts and averages', () => {
  it('converts foreign amounts to AUD and averages completed days only', () => {
    expect(computeReceiptAud(10000, 'JPY', 100)).toBe(100)

    const complete = day({
      id: '1',
      status: 'complete',
      receipts: [
        {
          id: 'r1',
          description: 'Lunch',
          category: 'meals',
          currencyCode: 'AUD',
          localAmount: 40,
          exchangeRate: 1,
          amountAud: 40,
          notes: '',
          imageDataUrl: null,
          imageFileName: null,
          evidenceId: null,
        },
        {
          id: 'r2',
          description: 'Dinner',
          category: 'meals',
          currencyCode: 'AUD',
          localAmount: 60,
          exchangeRate: 1,
          amountAud: 60,
          notes: '',
          imageDataUrl: null,
          imageFileName: null,
          evidenceId: null,
        },
      ],
    })
    const draft = day({
      id: '2',
      status: 'in_progress',
      receipts: [
        {
          id: 'r3',
          description: 'Coffee',
          category: 'meals',
          currencyCode: 'AUD',
          localAmount: 500,
          exchangeRate: 1,
          amountAud: 500,
          notes: '',
          imageDataUrl: null,
          imageFileName: null,
          evidenceId: null,
        },
      ],
    })

    expect(sampleDayTotalAud(complete)).toBe(100)
    expect(averageDailySpendAud([complete, draft])).toBe(100)
    expect(averageDailySpendAud([draft])).toBeNull()
  })

  it('normalises legacy amountAud-only receipts', () => {
    const legacy = normalizeSampleDay({
      id: 'x',
      destinationId: 'au',
      fyEndYear: 2026,
      label: 'Legacy',
      status: 'in_progress',
      receipts: [{ id: 'r', description: 'Meal', amountAud: 55 }],
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      completedAt: null,
    } as SampleDay & Record<string, unknown>)

    expect(legacy.receipts[0]?.currencyCode).toBe('AUD')
    expect(legacy.receipts[0]?.localAmount).toBe(55)
    expect(legacy.receipts[0]?.category).toBe('other')
    expect(legacy.receipts[0]?.notes).toBe('')
    expect(legacy.notes).toBe('')
  })
})

describe('fast receipt entry store', () => {
  beforeEach(() => {
    const store = new Map<string, string>()
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => {
        store.set(k, v)
      },
      removeItem: (k: string) => {
        store.delete(k)
      },
      clear: () => store.clear(),
      key: () => null,
      length: 0,
    })
  })

  it('adds and duplicates receipts with category and notes defaults', () => {
    const day = createSampleDay({ destinationId: 'au', fyEndYear: 2026, label: 'Test' })
    const withReceipt = addReceipt(day.id, {
      description: 'Lunch',
      category: 'meals',
      localAmount: 25,
      currencyCode: 'AUD',
    })
    expect(withReceipt?.receipts).toHaveLength(1)
    expect(withReceipt?.receipts[0]?.category).toBe('meals')
    expect(withReceipt?.receipts[0]?.notes).toBe('')

    const receiptId = withReceipt!.receipts[0]!.id
    const duplicated = duplicateReceipt(day.id, receiptId)
    expect(duplicated?.receipts).toHaveLength(2)
    expect(duplicated?.receipts[1]?.description).toContain('(copy)')
    expect(duplicated?.receipts[1]?.localAmount).toBe(25)
  })
})

describe('buildDestinationStats', () => {
  it('uses sample-day average for claim when complete days exist', () => {
    const stats = buildDestinationStats({
      destinationId: 'au',
      destinationName: 'Australia',
      fyEndYear: 2026,
      monthAway: [
        { id: '1', monthKey: '2025-09', destinationId: 'au', nights: 10 },
        { id: '2', monthKey: '2025-10', destinationId: 'au', nights: 5 },
      ],
      dailyRateAud: 200,
      sampleDays: [
        day({
          id: '1',
          status: 'complete',
          receipts: [
            {
              id: 'r',
              description: 'x',
              category: 'meals',
              currencyCode: 'AUD',
              localAmount: 150,
              exchangeRate: 1,
              amountAud: 150,
              notes: '',
              imageDataUrl: null,
              imageFileName: null,
              evidenceId: null,
            },
          ],
        }),
      ],
    })

    expect(stats.qualifyingOvernights).toBe(15)
    expect(stats.averageDailySpendAud).toBe(150)
    expect(stats.currentClaimAud).toBe(15 * 150)
    expect(stats.rateFromSampleDays).toBe(true)
  })
})

describe('calculateDestinationAverage', () => {
  it('traces Sample Days → Average → Calculation → Final Claim (Calculator parity)', () => {
    const dayA = day({
      id: 'a',
      label: 'Day A',
      status: 'complete',
      receipts: [
        {
          id: 'r1',
          description: 'Meals',
          category: 'meals',
          currencyCode: 'AUD',
          localAmount: 120,
          exchangeRate: 1,
          amountAud: 120,
          notes: '',
          imageDataUrl: null,
          imageFileName: null,
          evidenceId: null,
        },
      ],
    })
    const dayB = day({
      id: 'b',
      label: 'Day B',
      status: 'complete',
      receipts: [
        {
          id: 'r2',
          description: 'Meals',
          category: 'meals',
          currencyCode: 'AUD',
          localAmount: 180,
          exchangeRate: 1,
          amountAud: 180,
          notes: '',
          imageDataUrl: null,
          imageFileName: null,
          evidenceId: null,
        },
      ],
    })
    const draft = day({
      id: 'c',
      label: 'Draft',
      status: 'in_progress',
      receipts: [
        {
          id: 'r3',
          description: 'Ignored',
          category: 'meals',
          currencyCode: 'AUD',
          localAmount: 999,
          exchangeRate: 1,
          amountAud: 999,
          notes: '',
          imageDataUrl: null,
          imageFileName: null,
          evidenceId: null,
        },
      ],
    })

    const calc = calculateDestinationAverage({
      destinationId: 'au',
      destinationName: 'Australia',
      fyEndYear: 2026,
      monthAway: [
        { id: '1', monthKey: '2025-09', destinationId: 'au', nights: 10 },
        { id: '2', monthKey: '2025-10', destinationId: 'jp', nights: 4 },
      ],
      rates: [
        { destinationId: 'au', dailyRateAud: 200 },
        { destinationId: 'jp', dailyRateAud: 300 },
      ],
      destinationIds: ['au', 'jp'],
      plannerDailyRateAud: 200,
      sampleDays: [dayA, dayB, draft],
    })

    // Average = (120 + 180) / 2 = 150; draft excluded
    expect(calc.totalSampleDaysAud).toBe(300)
    expect(calc.sampleDaysCompleted).toBe(2)
    expect(calc.sampleDaysInProgress).toBe(1)
    expect(calc.averageDailySpendAud).toBe(150)
    expect(calc.averageAudValue).toBe(150)
    expect(calc.qualifyingOvernights).toBe(10)
    expect(calc.appliedDailyRateAud).toBe(150)
    expect(calc.rateSource).toBe('sample_day_average')
    expect(calc.destinationClaimAud).toBe(10 * 150)
    // FY = AU 10×150 + JP 4×300
    expect(calc.financialYearClaimAud).toBe(1500 + 1200)

    expect(calc.steps.map((s) => s.id)).toEqual([
      'sample-days',
      'average',
      'calculation',
      'final-claim',
    ])
    expect(calc.sampleDayContributions.find((c) => c.id === 'c')?.includedInAverage).toBe(false)
  })

  it('falls back to planner daily rate when no completed sample days', () => {
    const calc = calculateDestinationAverage({
      destinationId: 'au',
      destinationName: 'Australia',
      fyEndYear: 2026,
      monthAway: [{ id: '1', monthKey: '2025-09', destinationId: 'au', nights: 8 }],
      rates: [{ destinationId: 'au', dailyRateAud: 220 }],
      destinationIds: ['au'],
      plannerDailyRateAud: 220,
      sampleDays: [day({ id: 'd', status: 'in_progress' })],
    })

    expect(calc.averageDailySpendAud).toBeNull()
    expect(calc.rateSource).toBe('planner_daily_rate')
    expect(calc.appliedDailyRateAud).toBe(220)
    expect(calc.destinationClaimAud).toBe(8 * 220)
    expect(calc.financialYearClaimAud).toBe(8 * 220)
  })
})
