import {
  ENGINE_VERSION,
  buildCalculationTraces,
  emptyPlanner,
  summarizeFromPlanner,
  type CalculationTrace,
  type TaxPlannerState,
  type TaxYearSummary,
} from '@/features/tax-position/engine'
import { loadPlanner, savePlanner as persistPlannerRaw } from '@/shared/lib/local-data-store'

const SUMMARY_META_KEY = 'ajx.position.summaries.v1'

export type SummarySource =
  | 'user_edit'
  | 'import_planner'
  | 'recompute'
  | 'system'

export type PersistedTaxSummary = {
  fyEndYear: number
  engineVersion: string
  createdAt: string
  updatedAt: string
  source: SummarySource
  summary: TaxYearSummary
  traces: CalculationTrace[]
}

type SummaryStore = Record<string, PersistedTaxSummary>

function readSummaries(): SummaryStore {
  try {
    const raw = localStorage.getItem(SUMMARY_META_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as SummaryStore
  } catch {
    return {}
  }
}

function writeSummaries(store: SummaryStore) {
  localStorage.setItem(SUMMARY_META_KEY, JSON.stringify(store))
}

function keyFor(fyEndYear: number) {
  return String(fyEndYear)
}

/** Recompute + persist summary metadata without changing engine maths. */
export function recomputeAndPersistSummary(
  planner: TaxPlannerState,
  fyEndYear: number,
  source: SummarySource,
): PersistedTaxSummary | null {
  const summary = summarizeFromPlanner(planner, fyEndYear)
  if (!summary) return null
  const traces = buildCalculationTraces(planner, fyEndYear)
  const now = new Date().toISOString()
  const store = readSummaries()
  const existing = store[keyFor(fyEndYear)]
  const record: PersistedTaxSummary = {
    fyEndYear,
    engineVersion: summary.engineVersion || ENGINE_VERSION,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    source,
    summary,
    traces,
  }
  store[keyFor(fyEndYear)] = record
  writeSummaries(store)
  return record
}

export function getPersistedSummary(fyEndYear: number): PersistedTaxSummary | null {
  const store = readSummaries()
  const existing = store[keyFor(fyEndYear)]
  if (existing) return existing
  const planner = loadPlanner(fyEndYear)
  return recomputeAndPersistSummary(planner, fyEndYear, 'recompute')
}

export function saveTaxPlanner(
  planner: TaxPlannerState,
  source: SummarySource = 'user_edit',
): PersistedTaxSummary | null {
  persistPlannerRaw(planner)
  return recomputeAndPersistSummary(planner, planner.activeFyEndYear, source)
}

export function loadTaxPlanner(fyEndYear: number): TaxPlannerState {
  const planner = loadPlanner(fyEndYear)
  if (!planner.years.length) {
    return emptyPlanner(fyEndYear)
  }
  return planner
}

export function listFinancialYears(): number[] {
  const planner = loadPlanner(new Date().getFullYear())
  const years = planner.years.map((y) => y.fyEndYear)
  return [...new Set(years)].sort((a, b) => b - a)
}
