import { categoryLabel, type EvidenceRecord } from '@/features/evidence/types/evidence'
import type { SampleDay } from '@/features/destination-workspace/types/sample-day'
import type { TaxPlannerState, TaxYearRecord } from '@/features/tax-position/engine'
import { buildOvernightClaimProvenance } from '@/features/tax-position/utils/overnight-claim-provenance'
import {
  AUDIT_ZIP_SECTIONS,
  type AuditReadiness,
  type AuditReadinessTask,
  type AuditZipSection,
} from '@/features/audit/types/audit-package'
import { auditSectionForEvidence } from '@/features/audit/utils/categorize-evidence'

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

function linkedClaimIds(evidence: EvidenceRecord[]): Set<string> {
  return new Set(evidence.map((e) => e.linkedClaimId).filter((id): id is string => Boolean(id)))
}

function claimIdsWithoutEvidence(year: TaxYearRecord, linked: Set<string>): string[] {
  const ids: string[] = []
  const push = (id: string) => {
    if (!linked.has(id)) ids.push(id)
  }
  for (const c of year.otherClaims) push(c.id)
  for (const c of year.flights) push(c.id)
  for (const c of year.transport) push(c.id)
  for (const c of year.carKm) push(c.id)
  for (const c of year.laundry) push(c.id)
  for (const c of year.apartmentCosts) push(c.id)
  return ids
}

/**
 * Audit readiness for a financial year — organisational score only.
 * Does not alter Tax Position calculation behaviour.
 */
export function buildAuditReadiness(input: {
  fyEndYear: number
  planner: TaxPlannerState
  evidence: EvidenceRecord[]
  sampleDays: SampleDay[]
}): AuditReadiness {
  const year = input.planner.years.find((y) => y.fyEndYear === input.fyEndYear)
  const overnight = buildOvernightClaimProvenance({
    fyEndYear: input.fyEndYear,
    planner: input.planner,
    sampleDays: input.sampleDays,
  })

  const claimCount = year ? countClaims(year) : 0
  const linked = linkedClaimIds(input.evidence)
  const claimIdList = year ? claimIdsWithoutEvidence(year, linked) : []
  const linkedClaims = claimCount - claimIdList.length

  const byCategoryMap = new Map<string, number>()
  const bySectionMap = new Map<AuditZipSection, number>()
  for (const section of AUDIT_ZIP_SECTIONS) bySectionMap.set(section, 0)
  bySectionMap.set('01 Tax Position', 0)

  for (const item of input.evidence) {
    const label = categoryLabel(item.category)
    byCategoryMap.set(label, (byCategoryMap.get(label) ?? 0) + 1)
    const section = auditSectionForEvidence(item, year)
    bySectionMap.set(section, (bySectionMap.get(section) ?? 0) + 1)
  }

  const completed = input.sampleDays.filter((d) => d.status === 'complete').length
  const inProgress = input.sampleDays.filter((d) => d.status === 'in_progress').length
  const sampleTotal = input.sampleDays.length
  const samplePercent =
    overnight.totalOvernights === 0
      ? 100
      : sampleTotal === 0
        ? 0
        : Math.round((completed / Math.max(sampleTotal, 1)) * 100)

  const rosterCount = input.evidence.filter((e) => e.category === 'roster').length
  const monthsWithIncome = year
    ? year.monthlyIncome.filter((m) => m.incomeUsd > 0 || m.incomeUsd5th > 0 || m.incomeUsd20th > 0)
        .length
    : 0
  const payslipDocuments = input.evidence.filter((e) => e.category === 'payslip').length
  const hasIncome = monthsWithIncome > 0
  const incomePercent = !hasIncome
    ? 100
    : Math.min(100, Math.round((payslipDocuments / Math.max(monthsWithIncome, 1)) * 100))

  const missingEvidence: string[] = []
  const warnings: string[] = []
  const outstandingTasks: AuditReadinessTask[] = []

  if (input.evidence.length === 0) {
    missingEvidence.push('No supporting documents uploaded for this financial year.')
    outstandingTasks.push({
      id: 'upload-evidence',
      label: 'Upload supporting documents to the Evidence Vault',
      href: '/evidence',
      severity: 'missing',
    })
  }

  if (claimIdList.length > 0) {
    missingEvidence.push(
      `${claimIdList.length} claim(s) have no linked evidence document.`,
    )
    outstandingTasks.push({
      id: 'link-claims',
      label: `Link evidence to ${claimIdList.length} claim(s)`,
      href: '/evidence/claims-without-evidence',
      severity: 'missing',
    })
  }

  if (hasIncome && payslipDocuments === 0) {
    missingEvidence.push('Employment income recorded but no payslip documents found.')
    outstandingTasks.push({
      id: 'upload-payslips',
      label: 'Upload payslips for months with employment income',
      href: '/evidence',
      severity: 'missing',
    })
  } else if (hasIncome && payslipDocuments < monthsWithIncome) {
    warnings.push(
      `Payslip coverage is partial (${payslipDocuments} document(s) for ${monthsWithIncome} income month(s)).`,
    )
    outstandingTasks.push({
      id: 'more-payslips',
      label: 'Add payslips for remaining employment months',
      href: '/evidence',
      severity: 'warning',
    })
  }

  if (overnight.totalOvernights > 0 && completed === 0) {
    missingEvidence.push(
      'Overnight counts exist but no completed sample days — destination averages may use planner daily rates only.',
    )
    outstandingTasks.push({
      id: 'complete-sample-days',
      label: 'Complete sample days for overnight destinations',
      href: '/overnight',
      severity: 'missing',
    })
  } else if (overnight.totalOvernights > 0 && inProgress > 0) {
    warnings.push(`${inProgress} sample day(s) still in progress.`)
    outstandingTasks.push({
      id: 'finish-sample-days',
      label: `Finish ${inProgress} in-progress sample day(s)`,
      href: '/overnight',
      severity: 'warning',
    })
  }

  if (overnight.totalOvernights > 0 && rosterCount === 0) {
    warnings.push(
      'No roster documents uploaded. Rosters are evidence only — overnight counts remain the source of truth.',
    )
    outstandingTasks.push({
      id: 'upload-rosters',
      label: 'Upload roster evidence (optional but recommended)',
      href: '/evidence',
      severity: 'info',
    })
  }

  if (year && year.apartmentCosts.length > 0) {
    const apartmentLinked = year.apartmentCosts.filter((c) => linked.has(c.id)).length
    if (apartmentLinked < year.apartmentCosts.length) {
      warnings.push(
        `${year.apartmentCosts.length - apartmentLinked} apartment cost(s) lack linked evidence.`,
      )
    }
  }

  if (year && (year.dividends.length > 0 || year.capitalGains.length > 0)) {
    const invDocs = input.evidence.filter((e) => e.category === 'investment').length
    if (invDocs === 0) {
      warnings.push('Investment income recorded but no investment category documents found.')
      outstandingTasks.push({
        id: 'upload-investments',
        label: 'Upload dividend / investment statements',
        href: '/evidence',
        severity: 'warning',
      })
    }
  }

  // Check foreign claims missing rates
  if (year) {
    let missingRate = 0
    const checkRate = (localAmount: number, rate: number, code: string) => {
      if (code !== 'AUD' && localAmount > 0 && !(rate > 0)) missingRate += 1
    }
    for (const c of year.otherClaims) checkRate(c.localAmount, c.exchangeRate, c.currencyCode)
    for (const c of year.flights) checkRate(c.localAmount, c.exchangeRate, c.currencyCode)
    for (const c of year.transport) checkRate(c.localAmount, c.exchangeRate, c.currencyCode)
    if (missingRate > 0) {
      warnings.push(`${missingRate} foreign-currency claim(s) are missing an exchange rate.`)
      outstandingTasks.push({
        id: 'fix-fx',
        label: 'Refresh or set ATO exchange rates for foreign claims',
        href: '/settings',
        severity: 'warning',
      })
    }
  }

  // Weighted readiness — organisational, not a tax result
  const evidenceScore =
    claimCount === 0
      ? input.evidence.length > 0
        ? 25
        : 0
      : Math.round((linkedClaims / Math.max(claimCount, 1)) * 30)
  const docScore = input.evidence.length > 0 ? 15 : 0
  const incomeScore = Math.round((incomePercent / 100) * 20)
  const sampleScore =
    overnight.totalOvernights === 0
      ? 20
      : Math.round((Math.min(completed, Math.max(overnight.destinations.length, 1)) /
          Math.max(overnight.destinations.length, 1)) *
          20)
  const rosterScore = overnight.totalOvernights === 0 ? 10 : rosterCount > 0 ? 10 : 0
  const overnightPresence = overnight.totalOvernights > 0 || (year?.monthlyIncome.length ?? 0) > 0 ? 5 : 0

  const overallPercent = Math.min(
    100,
    evidenceScore + docScore + incomeScore + sampleScore + rosterScore + overnightPresence,
  )

  return {
    overallPercent,
    missingEvidence,
    warnings,
    evidenceCounts: {
      total: input.evidence.length,
      byCategory: [...byCategoryMap.entries()].map(([category, count]) => ({ category, count })),
      bySection: AUDIT_ZIP_SECTIONS.map((section) => ({
        section,
        count: bySectionMap.get(section) ?? 0,
      })),
      linkedClaims: Math.max(0, linkedClaims),
      claimCount,
    },
    sampleDayCompleteness: {
      total: sampleTotal,
      completed,
      inProgress,
      percent: samplePercent,
    },
    rosterUploads: {
      count: rosterCount,
      hasAny: rosterCount > 0,
    },
    incomeCompleteness: {
      monthsWithIncome,
      payslipDocuments,
      percent: incomePercent,
      hasIncome,
    },
    outstandingTasks,
  }
}
