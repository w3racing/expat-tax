import { describe, expect, it } from 'vitest'
import {
  buildDashboardSnapshot,
  computeCompletenessPercent,
} from '@/features/dashboard/utils/build-snapshot'
import type { SampleDay } from '@/features/destination-workspace/types/sample-day'
import type { TaxYearSummary } from '@/features/tax-position/engine'

function summary(partial: Partial<TaxYearSummary>): TaxYearSummary {
  return {
    engineVersion: 'test',
    fyEndYear: 2026,
    fyLabel: 'FY2026',
    employmentIncomeAud: 0,
    interestIncomeAud: 0,
    dividendIncomeAud: 0,
    rentalIncomeAud: 0,
    capitalGainsAud: 0,
    otherInvestmentAud: 0,
    totalIncomeAud: 0,
    superannuationAud: 0,
    overseasDailyAud: 0,
    overseasDailyCalculatedAud: 0,
    otherClaimsAud: 0,
    flightsAud: 0,
    transportAud: 0,
    carKmAud: 0,
    carKmEntered: 0,
    carKmClaimable: 0,
    laundryAud: 0,
    apartmentCostsAud: 0,
    totalClaimsAud: 0,
    taxableIncomeAud: 0,
    frankingCreditsAud: 0,
    tfnWithheldAud: 0,
    foreignTaxOffsetAud: 0,
    taxOffsetsAud: 0,
    grossIncomeTaxAud: 0,
    incomeTaxAud: 0,
    medicareLevyAud: 0,
    estimatedTaxAud: 0,
    effectiveRate: 0,
    paygPerPay: 0,
    bracketRows: [],
    ...partial,
  }
}

function sampleDay(partial: Partial<SampleDay> & Pick<SampleDay, 'id' | 'status'>): SampleDay {
  return {
    destinationId: 'au',
    fyEndYear: 2026,
    label: 'Day',
    notes: '',
    receipts: [],
    linkedEvidenceIds: [],
    completedAt: null,
    createdAt: '2025-09-01T00:00:00.000Z',
    updatedAt: '2025-09-01T00:00:00.000Z',
    ...partial,
  }
}

describe('computeCompletenessPercent', () => {
  it('scores overnight-first readiness bands', () => {
    expect(
      computeCompletenessPercent({
        hasIncome: false,
        qualifyingOvernights: 0,
        overseasClaimAud: 0,
        sampleDaysCompleted: 0,
        evidenceCount: 0,
      }),
    ).toBe(0)

    expect(
      computeCompletenessPercent({
        hasIncome: true,
        qualifyingOvernights: 10,
        overseasClaimAud: 1500,
        sampleDaysCompleted: 1,
        evidenceCount: 2,
      }),
    ).toBe(100)
  })
})

describe('buildDashboardSnapshot', () => {
  it('surfaces overseas claim, deductions, and recent sample days', () => {
    const snap = buildDashboardSnapshot({
      fyEndYear: 2026,
      fyLabel: 'FY 2025–26',
      summary: summary({
        employmentIncomeAud: 100_000,
        totalIncomeAud: 100_000,
        overseasDailyAud: 12_000,
        overseasDailyCalculatedAud: 12_000,
        totalClaimsAud: 14_000,
        taxableIncomeAud: 86_000,
        estimatedTaxAud: -2_400,
      }),
      evidence: [],
      sampleDays: [
        sampleDay({ id: 's1', status: 'complete', label: 'Sydney day 1' }),
        sampleDay({ id: 's2', status: 'in_progress', label: 'Draft' }),
      ],
      destinations: [{ id: 'au', name: 'Australia' }],
      claimCount: 2,
      unlinkedClaimCount: 0,
      qualifyingOvernights: 40,
      hasIncome: true,
      hasExpenses: true,
      monthlyIncomeAud: [{ monthKey: '2025-09', aud: 8000 }],
    })

    expect(snap.isEmpty).toBe(false)
    expect(snap.isRefundStance).toBe(true)
    expect(snap.overseasClaimAud).toBe(12_000)
    expect(snap.totalDeductionsAud).toBe(14_000)
    expect(snap.totalIncomeAud).toBe(100_000)
    expect(snap.sampleDaysCompleted).toBe(1)
    expect(snap.recentSampleDays).toHaveLength(2)
    expect(snap.recentSampleDays[0]?.href).toContain('/overnight/au/sample-days/')
    expect(snap.estimateAvailable).toBe(true)
  })

  it('marks empty years without panic metrics content', () => {
    const snap = buildDashboardSnapshot({
      fyEndYear: 2026,
      fyLabel: 'FY 2025–26',
      summary: null,
      evidence: [],
      sampleDays: [],
      destinations: [],
      claimCount: 0,
      unlinkedClaimCount: 0,
      qualifyingOvernights: 0,
      hasIncome: false,
      hasExpenses: false,
      monthlyIncomeAud: [],
    })

    expect(snap.isEmpty).toBe(true)
    expect(snap.estimateAvailable).toBe(false)
    expect(snap.completenessPercent).toBe(0)
  })
})
