/**
 * Full-app backup / restore for AJX Tax MVP.
 * Includes Tax Position planner, sample days (receipts), and evidence vault metadata (+ local binaries when present).
 * Does not include AI/OCR/Drive state.
 */

import type { SampleDay } from '@/features/destination-workspace/types/sample-day'
import { normalizeSampleDay } from '@/features/destination-workspace/types/sample-day'
import type { EvidenceRecord } from '@/features/evidence/types/evidence'
import {
  hydrateEvidenceBinaries,
  persistEvidenceRecords,
} from '@/features/evidence/services/evidence-vault'
import type { TaxPlannerState } from '@/features/tax-position/engine/types'
import { emptyPlanner } from '@/features/tax-position/engine'
import { readRawPlanner, replacePlannerState } from '@/shared/lib/local-data-store'

export const APP_BACKUP_VERSION = 'ajx-tax-backup-1' as const

const SAMPLE_DAYS_KEY = 'ajx.sample-days.v1'
const EVIDENCE_KEY = 'ajx.evidence.vault.v2'
const ACTIVE_FY_KEY = 'ajx.activeFyEndYear'

export type AppBackupPayload = {
  version: typeof APP_BACKUP_VERSION
  exportedAt: string
  activeFyEndYear: number
  planner: TaxPlannerState
  sampleDays: SampleDay[]
  evidence: EvidenceRecord[]
}

export type AppBackupSummary = {
  fyYears: number[]
  destinationCount: number
  overnightRows: number
  sampleDayCount: number
  evidenceCount: number
  exportedAt: string
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

export async function collectAppBackup(activeFyEndYear: number): Promise<AppBackupPayload> {
  const planner = readRawPlanner() ?? emptyPlanner(activeFyEndYear)
  const sampleStore = readJson<{ days: SampleDay[] }>(SAMPLE_DAYS_KEY, { days: [] })
  const evidenceMeta = readJson<EvidenceRecord[]>(EVIDENCE_KEY, []).filter((e) => !e.softDeletedAt)
  const evidence = await hydrateEvidenceBinaries(evidenceMeta)

  return {
    version: APP_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    activeFyEndYear,
    planner,
    sampleDays: (sampleStore.days ?? []).map((d) =>
      normalizeSampleDay(d as SampleDay & Record<string, unknown>),
    ),
    evidence,
  }
}

export function summarizeAppBackup(backup: AppBackupPayload): AppBackupSummary {
  const overnightRows = backup.planner.years.reduce((n, y) => n + y.monthAway.length, 0)
  return {
    fyYears: backup.planner.years.map((y) => y.fyEndYear).sort((a, b) => b - a),
    destinationCount: backup.planner.destinations.length,
    overnightRows,
    sampleDayCount: backup.sampleDays.length,
    evidenceCount: backup.evidence.length,
    exportedAt: backup.exportedAt,
  }
}

export function parseAppBackup(raw: unknown): AppBackupPayload {
  if (!raw || typeof raw !== 'object') {
    throw Object.assign(new Error('Backup file is empty or invalid.'), { code: 'BACKUP_INVALID' })
  }
  const data = raw as Partial<AppBackupPayload>
  if (data.version !== APP_BACKUP_VERSION) {
    throw Object.assign(
      new Error('This backup format is not supported. Export a fresh backup from AJX Tax.'),
      { code: 'BACKUP_VERSION' },
    )
  }
  if (!data.planner || !Array.isArray(data.planner.years)) {
    throw Object.assign(new Error('Backup is missing Tax Position data.'), { code: 'BACKUP_INVALID' })
  }
  return {
    version: APP_BACKUP_VERSION,
    exportedAt: typeof data.exportedAt === 'string' ? data.exportedAt : new Date().toISOString(),
    activeFyEndYear:
      typeof data.activeFyEndYear === 'number' ? data.activeFyEndYear : currentFallbackFy(data.planner),
    planner: data.planner,
    sampleDays: Array.isArray(data.sampleDays)
      ? data.sampleDays.map((d) => normalizeSampleDay(d as SampleDay & Record<string, unknown>))
      : [],
    evidence: Array.isArray(data.evidence) ? (data.evidence as EvidenceRecord[]) : [],
  }
}

function currentFallbackFy(planner: TaxPlannerState): number {
  return planner.activeFyEndYear || planner.years[0]?.fyEndYear || new Date().getFullYear()
}

/** Replace local MVP stores with backup contents. Destructive — caller must confirm. */
export async function restoreAppBackup(backup: AppBackupPayload): Promise<AppBackupSummary> {
  replacePlannerState(backup.planner)
  writeJson(SAMPLE_DAYS_KEY, { days: backup.sampleDays })
  await persistEvidenceRecords(backup.evidence)
  localStorage.setItem(ACTIVE_FY_KEY, String(backup.activeFyEndYear))
  return summarizeAppBackup(backup)
}

export async function downloadAppBackup(activeFyEndYear: number): Promise<AppBackupSummary> {
  const backup = await collectAppBackup(activeFyEndYear)
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `AJX-Tax-Backup-${backup.activeFyEndYear}-${backup.exportedAt.slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
  return summarizeAppBackup(backup)
}

export async function readBackupFile(file: File): Promise<AppBackupPayload> {
  const text = await file.text()
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw Object.assign(new Error('Could not read that file as JSON.'), { code: 'BACKUP_INVALID' })
  }
  return parseAppBackup(parsed)
}
