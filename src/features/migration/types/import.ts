/** Stable provenance for TaxPlannerState → Tax Position migration. */

export const AJX_V1_PROVENANCE_SOURCE = 'ajx_tax_v1' as const

export const AJX_V1_PROVENANCE_LABEL = 'Imported from AJX Tax Version 1' as const

/** Machine id — planner adapter contract. */
export const AJX_PLANNER_PROVENANCE_SOURCE = 'ajx_calculator_tax_planner_v2' as const

/** Human label (contract §6). */
export const AJX_PLANNER_PROVENANCE_LABEL = 'Imported from AJX Tax Version 1' as const

export const PLANNER_ADAPTER_ID = 'ajx-calculator-tax-planner-v2' as const

/** Semver of docs/migration/planner-adapter-contract.md */
export const PLANNER_ADAPTER_CONTRACT_VERSION = '1.0.0' as const

/** Product migration pipeline version recorded on every batch. */
export const MIGRATION_VERSION = 'mvp-planner-1.0.0' as const

export type EntityType =
  | 'profile'
  | 'employer'
  | 'evidence'
  | 'payslip'
  | 'trip'
  | 'claim'
  | 'note'
  | 'tag'
  | 'destination'
  | 'bank_account'
  | 'financial_year'
  | 'destination_rate'
  | 'employment_income_month'
  | 'destination_nights_month'
  | 'work_expense_claim'
  | 'flight_claim'
  | 'transport_claim'
  | 'car_km_claim'
  | 'laundry_claim'
  | 'apartment_expense_claim'
  | 'interest_entry'
  | 'dividend_entry'
  | 'rental_property_entry'
  | 'capital_gain_entry'
  | 'other_investment_entry'

export type CanonicalEvidence = {
  legacyId: string
  financialYear: string
  type: string
  title: string
  occurredOn?: string
  amount?: number
  currency?: string
  merchant?: string
  checksumSha256?: string
  fileName?: string
  mimeType?: string
  sourceUrl?: string
  tags?: string[]
  legacyPayload?: Record<string, unknown>
}

export type CanonicalEmployer = {
  legacyId: string
  name: string
  abn?: string
  legacyPayload?: Record<string, unknown>
}

export type CanonicalPayslip = {
  legacyId: string
  employerLegacyId?: string
  financialYear: string
  periodStart?: string
  periodEnd?: string
  gross?: number
  taxWithheld?: number
  net?: number
  legacyPayload?: Record<string, unknown>
}

export type CanonicalTrip = {
  legacyId: string
  title: string
  financialYear: string
  startsOn?: string
  endsOn?: string
  purpose?: string
  legacyPayload?: Record<string, unknown>
}

export type CanonicalClaim = {
  legacyId: string
  financialYear: string
  category: string
  label: string
  notes?: string
  evidenceLegacyIds?: string[]
  legacyPayload?: Record<string, unknown>
}

export type CanonicalImportBundle = {
  adapterId: string
  exportVersion: string
  exportedAt?: string
  profile?: {
    legacyId?: string
    displayName?: string
    email?: string
  }
  employers: CanonicalEmployer[]
  evidence: CanonicalEvidence[]
  payslips: CanonicalPayslip[]
  trips: CanonicalTrip[]
  claims: CanonicalClaim[]
  notes: Array<{ legacyId: string; body: string; financialYear?: string }>
  tags: Array<{ legacyId: string; name: string }>
}

export type ValidationIssue = {
  path: string
  message: string
}

export type ImportWarning = {
  code: string
  path?: string
  message: string
}

export type ValidationResult = {
  ok: boolean
  issues: ValidationIssue[]
  warnings: ImportWarning[]
}

export type PreviewYearSummary = {
  fyEndYear: number
  fyLabel: string
  claimCount: number
  incomeMonths: number
  estimatedTaxAud: number | null
  mergesExisting: boolean
}

export type PreviewSummary = {
  adapterId: string
  adapterLabel: string
  exportVersion: string
  migrationVersion: string
  adapterContractVersion: string
  provenanceSource: string
  provenanceLabel: string
  counts: Record<string, number>
  years: PreviewYearSummary[]
  warnings: ImportWarning[]
  samples: {
    evidence: CanonicalEvidence[]
    employers: CanonicalEmployer[]
    payslips: CanonicalPayslip[]
    claims: CanonicalClaim[]
  }
}

export type DuplicateMatch = {
  entityType: EntityType
  legacyId: string
  title: string
  method: 'legacy_id' | 'checksum' | 'fuzzy'
  confidence: number
  existingId?: string
}

export type DuplicateReport = {
  matches: DuplicateMatch[]
}

export type DuplicateDecision = 'skip' | 'import'

export type LegacyIdMapEntry = {
  entityType: EntityType
  legacyId: string
  /** Local MVP keeps original id; Postgres later may mint a new UUID. */
  newId: string
}

export type ImportWritePlan = {
  batchId: string
  adapterId: string
  provenanceSource: typeof AJX_V1_PROVENANCE_SOURCE | typeof AJX_PLANNER_PROVENANCE_SOURCE
  provenanceLabel: typeof AJX_V1_PROVENANCE_LABEL | typeof AJX_PLANNER_PROVENANCE_LABEL
  migrationVersion: string
  adapterContractVersion: string
  sourceFilename: string | null
  sourceChecksum: string | null
  sourceSchemaVersion: number | null
  employers: CanonicalEmployer[]
  evidence: CanonicalEvidence[]
  payslips: CanonicalPayslip[]
  trips: CanonicalTrip[]
  claims: CanonicalClaim[]
  notes: CanonicalImportBundle['notes']
  tags: CanonicalImportBundle['tags']
  skippedLegacyIds: string[]
  legacyIdMap: LegacyIdMapEntry[]
  warnings: ImportWarning[]
}

export type ExistingVaultIndex = {
  legacyIds: Set<string>
  checksums: Set<string>
  fuzzyKeys: Set<string>
}

export type ImportAdapter = {
  id: string
  label: string
  accept: string[]
  parse: (input: string) => CanonicalImportBundle
  validate: (bundle: CanonicalImportBundle) => ValidationResult
  preview: (bundle: CanonicalImportBundle) => PreviewSummary
  detectDuplicates: (
    bundle: CanonicalImportBundle,
    existing: ExistingVaultIndex,
  ) => DuplicateReport
  toWritePlan: (
    bundle: CanonicalImportBundle,
    decisions: Record<string, DuplicateDecision>,
    batchId: string,
    meta?: {
      sourceFilename?: string | null
      sourceChecksum?: string | null
    },
  ) => ImportWritePlan
}
