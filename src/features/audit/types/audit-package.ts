import type { TaxYearSummary } from '@/features/tax-position/engine'
import type { CalculationTrace } from '@/features/tax-position/engine/traces'
import type { OvernightClaimProvenance } from '@/features/tax-position/utils/overnight-claim-provenance'
import type { SampleDay } from '@/features/destination-workspace/types/sample-day'
import type { EvidenceRecord } from '@/features/evidence/types/evidence'
import type { TaxpayerDetails, ClaimLine, IncomeLine, ExpenseLine } from '@/features/export/types/accountant-package'

/** Deterministic ZIP section folders (user-facing ATO package layout). */
export const AUDIT_ZIP_SECTIONS = [
  '01 Tax Position',
  '02 Income',
  '03 Travel',
  '04 Rosters',
  '05 Apartment',
  '06 Investments',
  '07 Other Deductions',
] as const

export type AuditZipSection = (typeof AUDIT_ZIP_SECTIONS)[number]

export type AuditPackageOptions = {
  /** Embed receipt / evidence image thumbnails in the Audit Report PDF */
  includeReceiptThumbnails: boolean
}

export type CurrencyConversionRow = {
  id: string
  source: string
  dateYmd?: string
  description: string
  currencyCode: string
  localAmount: number
  /** Foreign units per A$1 (ATO / Calculator convention) */
  exchangeRate: number
  amountAud: number
  rateFromAto?: boolean
}

export type EvidenceRegisterRow = {
  id: string
  fileName: string
  category: string
  zipSection: AuditZipSection
  /** Full ZIP folder path, e.g. `03 Travel/Destinations/Sydney` */
  zipFolder: string
  linkedClaim: string | null
  documentDate: string | null
  uploadDate: string
  processingStatus: string
  hasBinary: boolean
}

export type ManifestDocument = {
  documentId: string
  originalFilename: string
  sha256: string
  category: string
  financialYear: string
  linkedClaim: string | null
  uploadDate: string
  exportDate: string
  zipPath: string
}

export type AuditManifest = {
  packageId: string
  packageVersion: string
  rulesetVersion: string
  fyEndYear: number
  fyLabel: string
  generatedAt: string
  taxpayer: TaxpayerDetails
  documentCount: number
  documents: ManifestDocument[]
}

export type AuditReadinessTask = {
  id: string
  label: string
  href: string
  severity: 'missing' | 'warning' | 'info'
}

export type AuditReadiness = {
  overallPercent: number
  missingEvidence: string[]
  warnings: string[]
  evidenceCounts: {
    total: number
    byCategory: Array<{ category: string; count: number }>
    bySection: Array<{ section: AuditZipSection; count: number }>
    linkedClaims: number
    claimCount: number
  }
  sampleDayCompleteness: {
    total: number
    completed: number
    inProgress: number
    percent: number
  }
  rosterUploads: {
    count: number
    hasAny: boolean
  }
  incomeCompleteness: {
    monthsWithIncome: number
    payslipDocuments: number
    percent: number
    hasIncome: boolean
  }
  outstandingTasks: AuditReadinessTask[]
}

export type AuditThumbnail = {
  id: string
  label: string
  /** data URL (image/*) */
  dataUrl: string
  source: 'sample_receipt' | 'evidence'
}

export type AuditPackageData = {
  packageId: string
  generatedAt: string
  engineVersion: string
  packageVersion: string
  rulesetVersion: string
  fyEndYear: number
  fyLabel: string
  taxpayer: TaxpayerDetails
  options: AuditPackageOptions
  income: IncomeLine[]
  expenses: ExpenseLine[]
  claims: ClaimLine[]
  summary: TaxYearSummary
  overnightClaim: OvernightClaimProvenance
  sampleDays: SampleDay[]
  currencyConversions: CurrencyConversionRow[]
  evidenceRegister: EvidenceRegisterRow[]
  evidence: EvidenceRecord[]
  traces: CalculationTrace[]
  readiness: AuditReadiness
  thumbnails: AuditThumbnail[]
  notes: string
  disclaimer: string
}

export const AUDIT_PACKAGE_VERSION = '1.0.0' as const
export const AUDIT_RULESET_VERSION = 'ato-audit-mvp-1' as const

export const AUDIT_DISCLAIMER =
  'This audit package was prepared in AJX Tax as an evidence organisation tool. It is suitable for provision to a registered tax agent or in response to an ATO information request. Indicative tax figures are working papers only — not a lodged return. You and your agent remain responsible for lodgement accuracy.'
