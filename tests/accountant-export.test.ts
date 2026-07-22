import { describe, expect, it } from 'vitest'
import { emptyPlanner, summarizeFromPlanner } from '@/features/tax-position/engine'
import { buildAccountantPackageData } from '@/features/export/utils/build-package-data'
import { generateAccountantSummaryPdf } from '@/features/export/services/generate-summary-pdf'

describe('accountant export package', () => {
  it('builds income, expenses, claims, and evidence sections', () => {
    const planner = emptyPlanner(2026)
    planner.years[0]!.monthlyIncome = [
      {
        id: 'm1',
        monthKey: '2025-07',
        incomeUsd5th: 5000,
        incomeUsd20th: 5000,
        incomeUsd: 10000,
        usdAudRate: 0.65,
      },
    ]
    planner.years[0]!.otherClaims = [
      {
        id: 'c1',
        description: 'Headset',
        currencyCode: 'AUD',
        localAmount: 200,
        exchangeRate: 1,
        workPercentage: 100,
      },
    ]
    planner.years[0]!.notes = 'Discuss uniform with agent'

    const summary = summarizeFromPlanner(planner, 2026)!
    const data = buildAccountantPackageData({
      taxpayer: { displayName: 'Alex', email: 'alex@example.com', userId: 'u1' },
      fyEndYear: 2026,
      fyLabel: '2025–26',
      planner,
      summary,
      evidence: [],
    })

    expect(data.income.some((r) => r.label === 'Total income')).toBe(true)
    expect(data.expenses.some((r) => r.label === 'Total deductions / claims')).toBe(true)
    expect(data.claims).toHaveLength(1)
    expect(data.claims[0]!.description).toBe('Headset')
    expect(data.notes).toContain('uniform')
    expect(data.overnightClaim).toBeDefined()
    expect(data.expenses.some((r) => r.label === 'Overseas overnight claim')).toBe(true)
    expect(data.evidence.gaps.length).toBeGreaterThan(0)
  })

  it('generates a non-empty PDF blob', async () => {
    const planner = emptyPlanner(2026)
    const summary = summarizeFromPlanner(planner, 2026)!
    const data = buildAccountantPackageData({
      taxpayer: { displayName: 'Alex', email: 'a@b.c', userId: 'u1' },
      fyEndYear: 2026,
      fyLabel: '2025–26',
      planner,
      summary,
      evidence: [],
    })
    const blob = await generateAccountantSummaryPdf(data)
    expect(blob.size).toBeGreaterThan(500)
    expect(blob.type).toContain('pdf')
  })
})
