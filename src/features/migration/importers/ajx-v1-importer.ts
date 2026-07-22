import {
  isV1ExportVersion,
  stripKnownKeys,
  v1ExportSchema,
} from '@/features/migration/schemas/v1-export'
import { detectDuplicates } from '@/features/migration/utils/duplicates'
import {
  AJX_V1_PROVENANCE_LABEL,
  AJX_V1_PROVENANCE_SOURCE,
  MIGRATION_VERSION,
  PLANNER_ADAPTER_CONTRACT_VERSION,
  type CanonicalImportBundle,
  type DuplicateDecision,
  type ImportAdapter,
  type ImportWritePlan,
  type PreviewSummary,
  type ValidationResult,
} from '@/features/migration/types/import'

const EVIDENCE_KEYS = [
  'id',
  'financialYear',
  'type',
  'title',
  'occurredOn',
  'amount',
  'currency',
  'merchant',
  'checksumSha256',
  'fileName',
  'mimeType',
  'sourceUrl',
  'tags',
]

function toBundle(raw: unknown): CanonicalImportBundle {
  const parsed = v1ExportSchema.parse(raw)

  if (!isV1ExportVersion(parsed.exportVersion)) {
    throw new Error(`Unsupported exportVersion: ${parsed.exportVersion}`)
  }

  if (parsed.app.toLowerCase() !== 'ajx-tax') {
    throw new Error(`Unsupported app: ${parsed.app}`)
  }

  return {
    adapterId: 'ajx-tax-v1',
    exportVersion: parsed.exportVersion,
    exportedAt: parsed.exportedAt,
    profile: parsed.profile
      ? {
          legacyId: parsed.profile.id,
          displayName: parsed.profile.displayName,
          email: parsed.profile.email,
        }
      : undefined,
    employers: parsed.employers.map((row) => ({
      legacyId: row.id,
      name: row.name,
      abn: row.abn,
      legacyPayload: stripKnownKeys(row, ['id', 'name', 'abn']),
    })),
    evidence: parsed.evidence.map((row) => ({
      legacyId: row.id,
      financialYear: row.financialYear,
      type: row.type,
      title: row.title,
      occurredOn: row.occurredOn,
      amount: row.amount,
      currency: row.currency,
      merchant: row.merchant,
      checksumSha256: row.checksumSha256,
      fileName: row.fileName,
      mimeType: row.mimeType,
      sourceUrl: row.sourceUrl,
      tags: row.tags,
      legacyPayload: stripKnownKeys(row, EVIDENCE_KEYS),
    })),
    payslips: parsed.payslips.map((row) => ({
      legacyId: row.id,
      employerLegacyId: row.employerId,
      financialYear: row.financialYear,
      periodStart: row.periodStart,
      periodEnd: row.periodEnd,
      gross: row.gross,
      taxWithheld: row.taxWithheld,
      net: row.net,
      legacyPayload: stripKnownKeys(row, [
        'id',
        'employerId',
        'financialYear',
        'periodStart',
        'periodEnd',
        'gross',
        'taxWithheld',
        'net',
      ]),
    })),
    trips: parsed.trips.map((row) => ({
      legacyId: row.id,
      title: row.title,
      financialYear: row.financialYear,
      startsOn: row.startsOn,
      endsOn: row.endsOn,
      purpose: row.purpose,
      legacyPayload: stripKnownKeys(row, [
        'id',
        'title',
        'financialYear',
        'startsOn',
        'endsOn',
        'purpose',
      ]),
    })),
    claims: parsed.claims.map((row) => ({
      legacyId: row.id,
      financialYear: row.financialYear,
      category: row.category,
      label: row.label,
      notes: row.notes,
      evidenceLegacyIds: row.evidenceIds,
      legacyPayload: stripKnownKeys(row, [
        'id',
        'financialYear',
        'category',
        'label',
        'notes',
        'evidenceIds',
      ]),
    })),
    notes: parsed.notes.map((row) => ({
      legacyId: row.id,
      body: row.body,
      financialYear: row.financialYear,
    })),
    tags: parsed.tags.map((row) => ({
      legacyId: row.id,
      name: row.name,
    })),
  }
}

function buildWritePlan(
  bundle: CanonicalImportBundle,
  decisions: Record<string, DuplicateDecision>,
  batchId: string,
  meta?: { sourceFilename?: string | null; sourceChecksum?: string | null },
): ImportWritePlan {
  const skippedLegacyIds = Object.entries(decisions)
    .filter(([, decision]) => decision === 'skip')
    .map(([legacyId]) => legacyId)

  const skip = new Set(skippedLegacyIds)

  const evidence = bundle.evidence.filter((row) => !skip.has(row.legacyId))
  const employers = bundle.employers.filter((row) => !skip.has(row.legacyId))
  const payslips = bundle.payslips.filter((row) => !skip.has(row.legacyId))
  const trips = bundle.trips.filter((row) => !skip.has(row.legacyId))
  const claims = bundle.claims.filter((row) => !skip.has(row.legacyId))
  const notes = bundle.notes.filter((row) => !skip.has(row.legacyId))
  const tags = bundle.tags.filter((row) => !skip.has(row.legacyId))

  return {
    batchId,
    adapterId: bundle.adapterId,
    provenanceSource: AJX_V1_PROVENANCE_SOURCE,
    provenanceLabel: AJX_V1_PROVENANCE_LABEL,
    migrationVersion: MIGRATION_VERSION,
    adapterContractVersion: PLANNER_ADAPTER_CONTRACT_VERSION,
    sourceFilename: meta?.sourceFilename ?? null,
    sourceChecksum: meta?.sourceChecksum ?? null,
    sourceSchemaVersion: null,
    employers,
    evidence,
    payslips,
    trips,
    claims,
    notes,
    tags,
    skippedLegacyIds,
    legacyIdMap: [
      ...employers.map((r) => ({
        entityType: 'employer' as const,
        legacyId: r.legacyId,
        newId: r.legacyId,
      })),
      ...evidence.map((r) => ({
        entityType: 'evidence' as const,
        legacyId: r.legacyId,
        newId: r.legacyId,
      })),
      ...payslips.map((r) => ({
        entityType: 'payslip' as const,
        legacyId: r.legacyId,
        newId: r.legacyId,
      })),
      ...trips.map((r) => ({
        entityType: 'trip' as const,
        legacyId: r.legacyId,
        newId: r.legacyId,
      })),
      ...claims.map((r) => ({
        entityType: 'claim' as const,
        legacyId: r.legacyId,
        newId: r.legacyId,
      })),
    ],
    warnings: [],
  }
}

export const ajxTaxV1Importer: ImportAdapter = {
  id: 'ajx-tax-v1',
  label: 'AJX Tax Version 1 (JSON)',
  accept: ['.json', 'application/json'],

  parse(input: string) {
    let json: unknown
    try {
      json = JSON.parse(input) as unknown
    } catch {
      throw new Error('File is not valid JSON')
    }
    return toBundle(json)
  },

  validate(bundle): ValidationResult {
    const issues: ValidationResult['issues'] = []

    if (!isV1ExportVersion(bundle.exportVersion)) {
      issues.push({
        path: 'exportVersion',
        message: 'Only AJX Tax Version 1 exports (1.x) are supported',
      })
    }

    if (bundle.evidence.length === 0 && bundle.payslips.length === 0) {
      issues.push({
        path: 'evidence',
        message: 'Export contains no evidence or payslips to import',
      })
    }

    const seen = new Set<string>()
    for (const item of bundle.evidence) {
      if (seen.has(item.legacyId)) {
        issues.push({
          path: `evidence.${item.legacyId}`,
          message: 'Duplicate id within export',
        })
      }
      seen.add(item.legacyId)
    }

    return { ok: issues.length === 0, issues, warnings: [] }
  },

  preview(bundle): PreviewSummary {
    return {
      adapterId: this.id,
      adapterLabel: this.label,
      exportVersion: bundle.exportVersion,
      migrationVersion: MIGRATION_VERSION,
      adapterContractVersion: PLANNER_ADAPTER_CONTRACT_VERSION,
      provenanceSource: AJX_V1_PROVENANCE_SOURCE,
      provenanceLabel: AJX_V1_PROVENANCE_LABEL,
      counts: {
        employers: bundle.employers.length,
        evidence: bundle.evidence.length,
        payslips: bundle.payslips.length,
        trips: bundle.trips.length,
        claims: bundle.claims.length,
        notes: bundle.notes.length,
        tags: bundle.tags.length,
      },
      years: [],
      warnings: [],
      samples: {
        evidence: bundle.evidence.slice(0, 5),
        employers: bundle.employers.slice(0, 5),
        payslips: bundle.payslips.slice(0, 5),
        claims: bundle.claims.slice(0, 5),
      },
    }
  },

  detectDuplicates: detectDuplicates,

  toWritePlan: buildWritePlan,
}
