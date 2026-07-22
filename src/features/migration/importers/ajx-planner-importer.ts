import { summarizeFromPlanner, type TaxPlannerState } from '@/features/tax-position/engine'
import {
  importPlannerState,
  readRawPlanner,
  replacePlannerState,
} from '@/shared/lib/local-data-store'
import { recomputeAndPersistSummary } from '@/features/tax-position/services/position-service'
import { isTaxPlannerState, parseTaxPlannerState } from '@/features/migration/importers/planner-parser'
import { mergePlannerStates } from '@/features/migration/utils/merge-planner'
import { analyzePlannerWarnings } from '@/features/migration/utils/planner-warnings'
import {
  buildPlannerLegacyIdMap,
  countPlannerEntities,
} from '@/features/migration/utils/legacy-id-map'
import { listImportedChecksums } from '@/features/migration/services/migration-log'
import {
  AJX_PLANNER_PROVENANCE_LABEL,
  AJX_PLANNER_PROVENANCE_SOURCE,
  MIGRATION_VERSION,
  PLANNER_ADAPTER_CONTRACT_VERSION,
  PLANNER_ADAPTER_ID,
} from '@/features/migration/types/import'
import type {
  CanonicalImportBundle,
  ImportAdapter,
  ImportWritePlan,
  PreviewSummary,
  ValidationResult,
} from '@/features/migration/types/import'

let lastPlanner: TaxPlannerState | null = null
let lastRawReceiptFolders: Record<number, unknown[]> = {}

export function getLastParsedPlanner(): TaxPlannerState | null {
  return lastPlanner
}

export function getLastReceiptFolders(): Record<number, unknown[]> {
  return lastRawReceiptFolders
}

export function clearLastParsedPlanner() {
  lastPlanner = null
  lastRawReceiptFolders = {}
}

function fyLabel(fyEndYear: number) {
  return `${fyEndYear - 1}–${String(fyEndYear).slice(2)}`
}

function plannerToBundle(state: TaxPlannerState): CanonicalImportBundle {
  return {
    adapterId: PLANNER_ADAPTER_ID,
    exportVersion: 'planner-2',
    employers: [],
    evidence: [],
    payslips: [],
    trips: [],
    claims: state.years.flatMap((y) => [
      ...y.otherClaims.map((c) => ({
        legacyId: c.id,
        financialYear: fyLabel(y.fyEndYear),
        category: 'work',
        label: [c.dateYmd, c.description ?? 'Work claim'].filter(Boolean).join(' · '),
      })),
      ...y.flights.map((c) => ({
        legacyId: c.id,
        financialYear: fyLabel(y.fyEndYear),
        category: 'flight',
        label: [c.dateYmd, c.description ?? 'Flight'].filter(Boolean).join(' · '),
      })),
      ...y.transport.map((c) => ({
        legacyId: c.id,
        financialYear: fyLabel(y.fyEndYear),
        category: 'transport',
        label: [c.dateYmd, c.description ?? 'Transport'].filter(Boolean).join(' · '),
      })),
    ]),
    notes: state.years
      .filter((y) => y.notes)
      .map((y) => ({
        legacyId: `notes-${y.fyEndYear}`,
        body: y.notes,
        financialYear: String(y.fyEndYear),
      })),
    tags: [],
  }
}

export const ajxTaxPlannerImporter: ImportAdapter = {
  id: PLANNER_ADAPTER_ID,
  label: 'AJX Tax Backup (TaxPlannerState)',
  accept: ['.json', 'application/json'],
  parse(input: string) {
    const json: unknown = JSON.parse(input)
    const state = parseTaxPlannerState(input)
    lastPlanner = state
    lastRawReceiptFolders = {}
    if (json && typeof json === 'object' && 'years' in json) {
      const years = (json as { years: Array<{ fyEndYear?: number; receiptFolders?: unknown[] }> })
        .years
      for (const y of years ?? []) {
        if (y.fyEndYear != null && Array.isArray(y.receiptFolders) && y.receiptFolders.length) {
          lastRawReceiptFolders[y.fyEndYear] = y.receiptFolders
        }
      }
    }
    return plannerToBundle(state)
  },
  validate(bundle): ValidationResult {
    if (bundle.adapterId !== PLANNER_ADAPTER_ID) {
      return {
        ok: false,
        issues: [{ path: 'adapterId', message: 'Not a TaxPlannerState backup' }],
        warnings: [],
      }
    }
    if (!lastPlanner?.years.length) {
      return {
        ok: false,
        issues: [{ path: 'years', message: 'No tax years in backup' }],
        warnings: [],
      }
    }
    const warnings = analyzePlannerWarnings(lastPlanner, {
      alreadyImportedChecksums: listImportedChecksums(),
      receiptFoldersByFy: lastRawReceiptFolders,
    })
    return { ok: true, issues: [], warnings }
  },
  preview(bundle): PreviewSummary {
    const state = lastPlanner
    const existing = readRawPlanner()
    const existingFys = new Set(existing?.years.map((y) => y.fyEndYear) ?? [])
    const counts = state ? countPlannerEntities(state) : { years: 0, destinations: 0, bankAccounts: 0, claims: 0, incomeMonths: 0 }
    const years =
      state?.years.map((y) => {
        const summary = summarizeFromPlanner(state, y.fyEndYear)
        return {
          fyEndYear: y.fyEndYear,
          fyLabel: fyLabel(y.fyEndYear),
          claimCount:
            y.otherClaims.length +
            y.flights.length +
            y.transport.length +
            y.carKm.length +
            y.laundry.length +
            y.apartmentCosts.length,
          incomeMonths: y.monthlyIncome.filter((m) => m.incomeUsd > 0).length,
          estimatedTaxAud: summary ? Math.round(summary.estimatedTaxAud) : null,
          mergesExisting: existingFys.has(y.fyEndYear),
        }
      }) ?? []

    return {
      adapterId: PLANNER_ADAPTER_ID,
      adapterLabel: 'AJX Tax Backup (TaxPlannerState)',
      exportVersion: bundle.exportVersion,
      migrationVersion: MIGRATION_VERSION,
      adapterContractVersion: PLANNER_ADAPTER_CONTRACT_VERSION,
      provenanceSource: AJX_PLANNER_PROVENANCE_SOURCE,
      provenanceLabel: AJX_PLANNER_PROVENANCE_LABEL,
      counts: {
        years: counts.years,
        claims: counts.claims,
        incomeMonths: counts.incomeMonths,
        destinations: counts.destinations,
        bankAccounts: counts.bankAccounts,
      },
      years,
      warnings: state
        ? analyzePlannerWarnings(state, {
            alreadyImportedChecksums: listImportedChecksums(),
            receiptFoldersByFy: lastRawReceiptFolders,
          })
        : [],
      samples: {
        evidence: [],
        employers: [],
        payslips: [],
        claims: bundle.claims.slice(0, 5),
      },
    }
  },
  detectDuplicates() {
    return { matches: [] }
  },
  toWritePlan(bundle, _decisions, batchId, meta): ImportWritePlan {
    const state = lastPlanner
    return {
      batchId,
      adapterId: PLANNER_ADAPTER_ID,
      provenanceSource: AJX_PLANNER_PROVENANCE_SOURCE,
      provenanceLabel: AJX_PLANNER_PROVENANCE_LABEL,
      migrationVersion: MIGRATION_VERSION,
      adapterContractVersion: PLANNER_ADAPTER_CONTRACT_VERSION,
      sourceFilename: meta?.sourceFilename ?? null,
      sourceChecksum: meta?.sourceChecksum ?? null,
      sourceSchemaVersion: 2,
      employers: [],
      evidence: [],
      payslips: [],
      trips: [],
      claims: bundle.claims,
      notes: bundle.notes,
      tags: [],
      skippedLegacyIds: [],
      legacyIdMap: state ? buildPlannerLegacyIdMap(state) : [],
      warnings: state
        ? analyzePlannerWarnings(state, {
            sourceChecksum: meta?.sourceChecksum,
            alreadyImportedChecksums: listImportedChecksums(),
            receiptFoldersByFy: lastRawReceiptFolders,
          })
        : [],
    }
  },
}

export function tryParseAsPlanner(input: string): TaxPlannerState | null {
  try {
    const json: unknown = JSON.parse(input)
    if (!isTaxPlannerState(json)) return null
    return parseTaxPlannerState(input)
  } catch {
    return null
  }
}

export function commitPlannerImport(state: TaxPlannerState) {
  const existing = readRawPlanner()
  const merged = mergePlannerStates(existing, state)
  replacePlannerState(merged)
  for (const year of merged.years) {
    if (state.years.some((y) => y.fyEndYear === year.fyEndYear)) {
      recomputeAndPersistSummary(merged, year.fyEndYear, 'import_planner')
    }
  }
  return summarizeFromPlanner(merged, merged.activeFyEndYear)
}

/** @deprecated Prefer commitPlannerImport — kept for callers that only have importPlannerState. */
export function commitPlannerImportLegacy(state: TaxPlannerState) {
  return importPlannerState(state)
}
