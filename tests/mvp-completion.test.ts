import { describe, expect, it, beforeEach, vi } from 'vitest'
import {
  collectAppBackup,
  parseAppBackup,
  restoreAppBackup,
  APP_BACKUP_VERSION,
} from '@/features/backup/services/app-backup'
import { buildOvernightClaimProvenance } from '@/features/tax-position/utils/overnight-claim-provenance'
import { emptyPlanner } from '@/features/tax-position/engine'
import { normalizeSampleDay, type SampleDay } from '@/features/destination-workspace/types/sample-day'

function mockStorage() {
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
  return store
}

describe('app backup restore', () => {
  beforeEach(() => {
    mockStorage()
  })

  it('round-trips planner, sample days, and evidence', () => {
    const planner = emptyPlanner(2026)
    planner.destinations = [{ id: 'au', name: 'Australia', sortOrder: 0 }]
    planner.years[0]!.monthAway = [
      { id: '1', monthKey: '2025-09', destinationId: 'au', nights: 10 },
    ]
    localStorage.setItem('ajx.position.v1', JSON.stringify({ planner }))
    localStorage.setItem(
      'ajx.sample-days.v1',
      JSON.stringify({
        days: [
          normalizeSampleDay({
            id: 's1',
            destinationId: 'au',
            fyEndYear: 2026,
            label: 'Day 1',
            status: 'complete',
            receipts: [],
            createdAt: '2025-09-01T00:00:00.000Z',
            updatedAt: '2025-09-01T00:00:00.000Z',
            completedAt: '2025-09-01T00:00:00.000Z',
          } as SampleDay & Record<string, unknown>),
        ],
      }),
    )
    localStorage.setItem(
      'ajx.evidence.vault.v2',
      JSON.stringify([
        {
          id: 'e1',
          title: 'Receipt',
          fileName: 'r.pdf',
          category: 'receipt',
          fyEndYear: 2026,
          softDeletedAt: null,
          processingStatus: 'ready',
          createdAt: '2025-09-01T00:00:00.000Z',
          updatedAt: '2025-09-01T00:00:00.000Z',
        },
      ]),
    )

    const backup = collectAppBackup(2026)
    expect(backup.version).toBe(APP_BACKUP_VERSION)
    expect(backup.sampleDays).toHaveLength(1)
    expect(backup.evidence).toHaveLength(1)

    localStorage.clear()
    restoreAppBackup(backup)

    const restored = collectAppBackup(2026)
    expect(restored.sampleDays).toHaveLength(1)
    expect(restored.evidence).toHaveLength(1)
    expect(restored.planner.years[0]?.monthAway[0]?.nights).toBe(10)
  })

  it('rejects unknown backup versions', () => {
    expect(() => parseAppBackup({ version: 'old', planner: { years: [] } })).toThrow()
  })
})

describe('overnight claim provenance', () => {
  it('uses sample-day average when completed days exist', () => {
    const planner = emptyPlanner(2026)
    planner.destinations = [{ id: 'au', name: 'Australia', sortOrder: 0 }]
    planner.ratesByFy['2026'] = [{ destinationId: 'au', dailyRateAud: 200 }]
    planner.years[0]!.monthAway = [
      { id: '1', monthKey: '2025-09', destinationId: 'au', nights: 8 },
    ]

    const day = normalizeSampleDay({
      id: 's1',
      destinationId: 'au',
      fyEndYear: 2026,
      label: 'Day 1',
      status: 'complete',
      receipts: [
        {
          id: 'r1',
          description: 'Meals',
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
      createdAt: '2025-09-01T00:00:00.000Z',
      updatedAt: '2025-09-01T00:00:00.000Z',
      completedAt: '2025-09-01T00:00:00.000Z',
    } as SampleDay & Record<string, unknown>)

    const prov = buildOvernightClaimProvenance({
      fyEndYear: 2026,
      planner,
      sampleDays: [day],
    })

    expect(prov.totalOvernights).toBe(8)
    expect(prov.destinations[0]?.rateSource).toBe('sample_day_average')
    expect(prov.destinations[0]?.claimAud).toBe(8 * 150)
    expect(prov.totalClaimAud).toBe(8 * 150)
  })
})
