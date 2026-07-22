import type { TaxYearSummary } from '@/features/tax-position/engine'
import type { EvidenceRecord } from '@/features/evidence/types/evidence'
import type { SampleDay } from '@/features/destination-workspace/types/sample-day'

export type ActivityItem = {
  id: string
  title: string
  meta: string
  kind: 'evidence' | 'sample_day' | 'position'
  href: string
  statusLabel?: string
}

export type MissingItem = {
  id: string
  title: string
  description: string
  href: string
  count?: number
}

export type DashboardSnapshot = {
  fyEndYear: number
  fyLabel: string
  isEmpty: boolean
  summary: TaxYearSummary | null
  /** estimatedTaxAud — negative ≈ refund stance in Calculator terms */
  estimatedTaxAud: number
  isRefundStance: boolean
  estimateAvailable: boolean
  totalIncomeAud: number
  /** All deductions / claims */
  totalDeductionsAud: number
  /** Overseas overnight claim (nights × rate path) */
  overseasClaimAud: number
  overseasClaimCalculatedAud: number
  employmentIncomeAud: number
  investmentIncomeAud: number
  workExpensesAud: number
  travelExpensesAud: number
  qualifyingOvernights: number
  evidenceCount: number
  linkedEvidenceCount: number
  claimCount: number
  sampleDaysCompleted: number
  sampleDaysInProgress: number
  completenessPercent: number
  missing: MissingItem[]
  recentUploads: ActivityItem[]
  recentSampleDays: ActivityItem[]
  /** @deprecated use recentUploads — kept for transitional callers */
  recentActivity: ActivityItem[]
  incomeByMonth: Array<{ label: string; value: number }>
}

export type DashboardInputs = {
  fyEndYear: number
  fyLabel: string
  summary: TaxYearSummary | null
  evidence: EvidenceRecord[]
  sampleDays: SampleDay[]
  destinations: Array<{ id: string; name: string }>
  claimCount: number
  unlinkedClaimCount: number
  qualifyingOvernights: number
  hasIncome: boolean
  hasExpenses: boolean
  monthlyIncomeAud: Array<{ monthKey: string; aud: number }>
}
