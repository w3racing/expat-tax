import type { TaxYearSummary } from '@/features/tax-position/engine'
import type { OvernightClaimProvenance } from '@/features/tax-position/utils/overnight-claim-provenance'

export type TaxpayerDetails = {
  displayName: string
  email: string
  userId: string
}

export type IncomeLine = {
  label: string
  amountAud: number
}

export type ExpenseLine = {
  label: string
  amountAud: number
}

export type ClaimLine = {
  id: string
  category: string
  dateYmd?: string
  description: string
  amountAud: number
  currencyNote?: string
  linkedEvidence: boolean
}

export type EvidenceCompleteness = {
  documentCount: number
  linkedCount: number
  claimCount: number
  completenessPercent: number
  byCategory: Array<{ category: string; count: number }>
  gaps: string[]
}

export type AccountantPackageData = {
  generatedAt: string
  engineVersion: string
  exportVersion: string
  fyEndYear: number
  fyLabel: string
  taxpayer: TaxpayerDetails
  income: IncomeLine[]
  expenses: ExpenseLine[]
  claims: ClaimLine[]
  summary: TaxYearSummary
  evidence: EvidenceCompleteness
  /** Overnight claim with destination / sample-day provenance */
  overnightClaim: OvernightClaimProvenance
  notes: string
  disclaimer: string
}

export const ACCOUNTANT_EXPORT_VERSION = 'mvp-1.2.0' as const

export const ACCOUNTANT_DISCLAIMER =
  'Indicative working papers prepared in AJX Tax for discussion with a registered tax agent. Not a tax return, not advice, and not suitable for lodgement with the ATO without review.'
