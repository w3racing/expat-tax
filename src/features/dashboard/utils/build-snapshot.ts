import type {
  ActivityItem,
  DashboardInputs,
  DashboardSnapshot,
  MissingItem,
} from '@/features/dashboard/types/snapshot'
import { sampleDayTotalAud } from '@/features/destination-workspace/types/sample-day'
import { EVIDENCE_CATEGORY_LABELS } from '@/features/evidence/types/evidence'
import { foreignToAud } from '@/features/tax-position/engine'

function monthLabel(monthKey: string): string {
  const [, m] = monthKey.split('-')
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const idx = Number(m) - 1
  return names[idx] ?? monthKey
}

function destinationName(
  destinations: Array<{ id: string; name: string }>,
  destinationId: string,
): string {
  return destinations.find((d) => d.id === destinationId)?.name ?? 'Destination'
}

/**
 * Completeness for overnight-first MVP:
 * income · overnights · overseas claim · sample days · evidence.
 */
export function computeCompletenessPercent(input: {
  hasIncome: boolean
  qualifyingOvernights: number
  overseasClaimAud: number
  sampleDaysCompleted: number
  evidenceCount: number
}): number {
  let score = 0
  if (input.hasIncome) score += 25
  if (input.qualifyingOvernights > 0) score += 25
  if (input.overseasClaimAud > 0) score += 20
  if (input.sampleDaysCompleted > 0) score += 15
  if (input.evidenceCount > 0) score += 15
  return Math.min(100, score)
}

export function buildDashboardSnapshot(input: DashboardInputs): DashboardSnapshot {
  const { summary, evidence, sampleDays, claimCount, fyEndYear, fyLabel } = input
  const estimatedTaxAud = summary?.estimatedTaxAud ?? 0
  const totalIncomeAud = summary?.totalIncomeAud ?? 0
  const totalDeductionsAud = summary?.totalClaimsAud ?? 0
  const overseasClaimAud = summary?.overseasDailyAud ?? 0
  const overseasClaimCalculatedAud = summary?.overseasDailyCalculatedAud ?? 0
  const linkedEvidenceCount = evidence.filter((e) => e.linkedClaimId || e.destinationId).length
  const sampleDaysCompleted = sampleDays.filter((d) => d.status === 'complete').length
  const sampleDaysInProgress = sampleDays.filter((d) => d.status === 'in_progress').length

  const completenessPercent = computeCompletenessPercent({
    hasIncome: input.hasIncome,
    qualifyingOvernights: input.qualifyingOvernights,
    overseasClaimAud,
    sampleDaysCompleted,
    evidenceCount: evidence.length,
  })

  const missing: MissingItem[] = []
  if (!input.hasIncome) {
    missing.push({
      id: 'income',
      title: 'No income recorded',
      description: 'Add employment income so your estimate is meaningful.',
      href: '/position',
    })
  }
  if (input.qualifyingOvernights === 0 && input.hasIncome) {
    missing.push({
      id: 'overnights',
      title: 'No overnight counts',
      description: 'Enter qualifying nights by destination in the Overnight Planner.',
      href: '/overnight',
    })
  }
  if (input.qualifyingOvernights > 0 && sampleDaysCompleted === 0) {
    missing.push({
      id: 'sample-days',
      title: 'No completed sample days',
      description: 'Complete a sample day so your average daily spend can update the claim.',
      href: '/overnight',
    })
  }
  if (evidence.length === 0 && (input.hasIncome || input.qualifyingOvernights > 0)) {
    missing.push({
      id: 'docs',
      title: 'No documents uploaded',
      description: 'Upload receipts and supporting documents to the Evidence Vault.',
      href: '/evidence',
    })
  }
  if (input.unlinkedClaimCount > 0) {
    missing.push({
      id: 'unlinked',
      title: 'Claims without evidence',
      description: 'Link receipts or documents to strengthen your working papers.',
      href: '/evidence/claims-without-evidence',
      count: input.unlinkedClaimCount,
    })
  }

  const recentUploads: ActivityItem[] = evidence.slice(0, 5).map((item) => ({
    id: item.id,
    title: item.title || item.fileName,
    meta: `${EVIDENCE_CATEGORY_LABELS[item.category] ?? 'Document'} · ${formatRelative(item.createdAt)}`,
    kind: 'evidence' as const,
    href: '/evidence',
    statusLabel:
      item.processingStatus === 'ready'
        ? 'Ready'
        : item.processingStatus === 'failed'
          ? 'Failed'
          : 'Queued',
  }))

  const recentSampleDays: ActivityItem[] = sampleDays.slice(0, 5).map((day) => {
    const name = destinationName(input.destinations, day.destinationId)
    return {
      id: day.id,
      title: day.label,
      meta: `${name} · ${day.status === 'complete' ? 'Completed' : 'In progress'} · ${formatAudShort(sampleDayTotalAud(day))} · ${formatRelative(day.updatedAt)}`,
      kind: 'sample_day' as const,
      href: `/overnight/${day.destinationId}/sample-days/${day.id}`,
      statusLabel: day.status === 'complete' ? 'Complete' : 'In progress',
    }
  })

  const incomeByMonth = input.monthlyIncomeAud.map((row) => ({
    label: monthLabel(row.monthKey),
    value: Math.round(row.aud),
  }))

  const isEmpty =
    totalIncomeAud === 0 &&
    totalDeductionsAud === 0 &&
    evidence.length === 0 &&
    sampleDays.length === 0 &&
    input.qualifyingOvernights === 0

  const estimateAvailable = totalIncomeAud > 0 || totalDeductionsAud > 0

  return {
    fyEndYear,
    fyLabel,
    isEmpty,
    summary,
    estimatedTaxAud,
    isRefundStance: estimatedTaxAud < 0,
    estimateAvailable,
    totalIncomeAud,
    totalDeductionsAud,
    overseasClaimAud,
    overseasClaimCalculatedAud,
    employmentIncomeAud: summary?.employmentIncomeAud ?? 0,
    investmentIncomeAud:
      (summary?.interestIncomeAud ?? 0) +
      (summary?.dividendIncomeAud ?? 0) +
      (summary?.rentalIncomeAud ?? 0) +
      (summary?.capitalGainsAud ?? 0) +
      (summary?.otherInvestmentAud ?? 0),
    workExpensesAud:
      (summary?.otherClaimsAud ?? 0) +
      (summary?.flightsAud ?? 0) +
      (summary?.transportAud ?? 0) +
      (summary?.laundryAud ?? 0),
    travelExpensesAud: overseasClaimAud + (summary?.apartmentCostsAud ?? 0),
    qualifyingOvernights: input.qualifyingOvernights,
    evidenceCount: evidence.length,
    linkedEvidenceCount,
    claimCount,
    sampleDaysCompleted,
    sampleDaysInProgress,
    completenessPercent,
    missing,
    recentUploads,
    recentSampleDays,
    recentActivity: recentUploads,
    incomeByMonth,
  }
}

export function monthlyIncomeFromPlanner(
  months: Array<{
    monthKey: string
    incomeUsd: number
    incomeUsd5th: number
    incomeUsd20th: number
    usdAudRate: number
  }>,
) {
  return months.map((m) => ({
    monthKey: m.monthKey,
    aud: foreignToAud(m.incomeUsd || m.incomeUsd5th + m.incomeUsd20th, m.usdAudRate),
  }))
}

function formatAudShort(n: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(n)
}

export function formatRelative(iso: string): string {
  const then = new Date(iso).getTime()
  const diff = Date.now() - then
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 14) return `${days}d ago`
  return new Date(iso).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
}
