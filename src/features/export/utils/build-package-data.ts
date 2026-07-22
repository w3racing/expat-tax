import {
  claimAud,
  ENGINE_VERSION,
  type TaxPlannerState,
  type TaxYearRecord,
  type TaxYearSummary,
} from '@/features/tax-position/engine'
import type { EvidenceRecord } from '@/features/evidence/types/evidence'
import { categoryLabel } from '@/features/evidence/types/evidence'
import type { SampleDay } from '@/features/destination-workspace/types/sample-day'
import { buildOvernightClaimProvenance } from '@/features/tax-position/utils/overnight-claim-provenance'
import {
  ACCOUNTANT_DISCLAIMER,
  ACCOUNTANT_EXPORT_VERSION,
  type AccountantPackageData,
  type ClaimLine,
  type TaxpayerDetails,
} from '@/features/export/types/accountant-package'

function countClaims(year: TaxYearRecord): number {
  return (
    year.otherClaims.length +
    year.flights.length +
    year.transport.length +
    year.carKm.length +
    year.laundry.length +
    year.apartmentCosts.length
  )
}

function buildClaimLines(year: TaxYearRecord, evidence: EvidenceRecord[]): ClaimLine[] {
  const linked = new Set(
    evidence.map((e) => e.linkedClaimId).filter((id): id is string => Boolean(id)),
  )
  const lines: ClaimLine[] = []

  for (const c of year.otherClaims) {
    const amountAud = claimAud(c.localAmount, c.exchangeRate, c.workPercentage, {
      manualAud: c.manualAud,
      amountAud: c.amountAud,
    })
    lines.push({
      id: c.id,
      category: 'Work expense',
      dateYmd: c.dateYmd,
      description: c.description?.trim() || 'Work-related expense',
      amountAud,
      currencyNote: c.currencyCode !== 'AUD' ? `${c.currencyCode} ${c.localAmount}` : undefined,
      linkedEvidence: linked.has(c.id),
    })
  }
  for (const c of year.flights) {
    lines.push({
      id: c.id,
      category: 'Flight',
      dateYmd: c.dateYmd,
      description: c.description?.trim() || 'Flight',
      amountAud: claimAud(c.localAmount, c.exchangeRate, c.workPercentage),
      currencyNote: c.currencyCode !== 'AUD' ? `${c.currencyCode} ${c.localAmount}` : undefined,
      linkedEvidence: linked.has(c.id),
    })
  }
  for (const c of year.transport) {
    lines.push({
      id: c.id,
      category: 'Transport',
      dateYmd: c.dateYmd,
      description: c.description?.trim() || 'Transport',
      amountAud: claimAud(c.localAmount, c.exchangeRate, c.workPercentage, {
        manualAud: c.manualAud,
        amountAud: c.audAmount,
      }),
      currencyNote: c.currencyCode !== 'AUD' ? `${c.currencyCode} ${c.localAmount}` : undefined,
      linkedEvidence: linked.has(c.id),
    })
  }
  let remainingCarKm = 5000
  for (const c of year.carKm) {
    const claimable = Math.min(c.kilometres, remainingCarKm)
    remainingCarKm -= claimable
    lines.push({
      id: c.id,
      category: 'Car (cents/km)',
      dateYmd: c.dateYmd,
      description: c.description?.trim() || `${c.kilometres} km @ ${c.centsPerKm}¢`,
      amountAud: (claimable * c.centsPerKm) / 100,
      linkedEvidence: linked.has(c.id),
    })
  }
  for (const c of year.laundry) {
    lines.push({
      id: c.id,
      category: 'Laundry',
      dateYmd: c.dateYmd,
      description: c.description?.trim() || 'Laundry',
      amountAud: claimAud(c.localAmount, c.exchangeRate, 100),
      currencyNote: `JPY ${c.localAmount}`,
      linkedEvidence: linked.has(c.id),
    })
  }
  for (const c of year.apartmentCosts) {
    lines.push({
      id: c.id,
      category: 'Apartment',
      dateYmd: c.dateYmd,
      description: c.description?.trim() || c.kind,
      amountAud: claimAud(c.localAmount, c.exchangeRate, 100),
      currencyNote: `JPY ${c.localAmount}`,
      linkedEvidence: linked.has(c.id),
    })
  }

  return lines
}

function evidenceGaps(
  year: TaxYearRecord,
  evidence: EvidenceRecord[],
  claimCount: number,
  linkedCount: number,
  overnight: ReturnType<typeof buildOvernightClaimProvenance>,
): string[] {
  const gaps: string[] = []
  if (evidence.length === 0) gaps.push('No evidence documents uploaded for this financial year.')
  if (claimCount > 0 && linkedCount < claimCount) {
    gaps.push(`${claimCount - linkedCount} claim(s) have no linked evidence.`)
  }
  if (
    year.monthlyIncome.some((m) => m.incomeUsd > 0) &&
    !evidence.some((e) => e.category === 'payslip')
  ) {
    gaps.push('Employment income recorded but no payslip category documents found.')
  }
  if (overnight.totalOvernights > 0 && overnight.completedSampleDayCount === 0) {
    gaps.push(
      'Overnight counts exist but no completed sample days — averages may use planner daily rates only.',
    )
  }
  return gaps
}

export function buildAccountantPackageData(input: {
  taxpayer: TaxpayerDetails
  fyEndYear: number
  fyLabel: string
  planner: TaxPlannerState
  summary: TaxYearSummary
  evidence: EvidenceRecord[]
  sampleDays?: SampleDay[]
}): AccountantPackageData {
  const year = input.planner.years.find((y) => y.fyEndYear === input.fyEndYear)
  const claimCount = year ? countClaims(year) : 0
  const claims = year ? buildClaimLines(year, input.evidence) : []
  const linkedCount = claims.filter((c) => c.linkedEvidence).length
  const s = input.summary
  const sampleDays = input.sampleDays ?? []
  const overnightClaim = buildOvernightClaimProvenance({
    fyEndYear: input.fyEndYear,
    planner: input.planner,
    sampleDays,
  })

  const byCategoryMap = new Map<string, number>()
  for (const item of input.evidence) {
    const label = categoryLabel(item.category)
    byCategoryMap.set(label, (byCategoryMap.get(label) ?? 0) + 1)
  }

  const completenessPercent =
    claimCount === 0 && input.evidence.length === 0 && overnightClaim.totalOvernights === 0
      ? 0
      : Math.min(
          100,
          Math.round((linkedCount / Math.max(claimCount, 1)) * 40) +
            (input.evidence.length > 0 ? 15 : 0) +
            (s.totalIncomeAud > 0 ? 15 : 0) +
            (overnightClaim.totalOvernights > 0 ? 15 : 0) +
            (overnightClaim.completedSampleDayCount > 0 ? 15 : 0),
        )

  return {
    generatedAt: new Date().toISOString(),
    engineVersion: ENGINE_VERSION,
    exportVersion: ACCOUNTANT_EXPORT_VERSION,
    fyEndYear: input.fyEndYear,
    fyLabel: input.fyLabel,
    taxpayer: input.taxpayer,
    income: [
      { label: 'Employment income', amountAud: s.employmentIncomeAud },
      { label: 'Interest', amountAud: s.interestIncomeAud },
      { label: 'Dividends (incl. franking)', amountAud: s.dividendIncomeAud },
      { label: 'Rental (net)', amountAud: s.rentalIncomeAud },
      { label: 'Capital gains (net)', amountAud: s.capitalGainsAud },
      { label: 'Other investment income', amountAud: s.otherInvestmentAud },
      { label: 'Total income', amountAud: s.totalIncomeAud },
    ],
    expenses: [
      { label: 'Overseas overnight claim', amountAud: s.overseasDailyAud },
      { label: 'Work expenses', amountAud: s.otherClaimsAud },
      { label: 'Flights', amountAud: s.flightsAud },
      { label: 'Transport', amountAud: s.transportAud },
      { label: 'Car (cents per km)', amountAud: s.carKmAud },
      { label: 'Laundry', amountAud: s.laundryAud },
      { label: 'Apartment costs', amountAud: s.apartmentCostsAud },
      { label: 'Total deductions / claims', amountAud: s.totalClaimsAud },
    ],
    claims,
    summary: s,
    evidence: {
      documentCount: input.evidence.length,
      linkedCount,
      claimCount,
      completenessPercent,
      byCategory: [...byCategoryMap.entries()].map(([category, count]) => ({ category, count })),
      gaps: year
        ? evidenceGaps(year, input.evidence, claimCount, linkedCount, overnightClaim)
        : [],
    },
    overnightClaim,
    notes: year?.notes?.trim() ?? '',
    disclaimer: ACCOUNTANT_DISCLAIMER,
  }
}
