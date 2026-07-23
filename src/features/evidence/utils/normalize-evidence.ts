import type { EvidenceRecord } from '@/features/evidence/types/evidence'
import { isEvidenceCategory } from '@/features/evidence/types/evidence'

/** Local calendar date as YYYY-MM-DD (avoids UTC day-shift for AU timezones). */
export function localDateYmd(date: Date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Derive YYYY-MM from a document date or ISO timestamp. */
export function monthKeyFromDate(dateYmdOrIso: string | null | undefined): string | null {
  if (!dateYmdOrIso?.trim()) return null
  const m = /^(\d{4})-(\d{2})/.exec(dateYmdOrIso.trim())
  if (!m) return null
  return `${m[1]}-${m[2]}`
}

export function parseTagsInput(raw: string): string[] {
  const seen = new Set<string>()
  const tags: string[] = []
  for (const part of raw.split(/[,;]+/)) {
    const tag = part.trim().toLowerCase()
    if (!tag || seen.has(tag)) continue
    seen.add(tag)
    tags.push(tag)
  }
  return tags
}

export function formatTagsInput(tags: string[]): string {
  return tags.join(', ')
}

/** Ensure older local vault rows have MVP fields. */
export function normalizeEvidenceRecord(raw: EvidenceRecord & Record<string, unknown>): EvidenceRecord {
  const category =
    typeof raw.category === 'string' && isEvidenceCategory(raw.category) ? raw.category : 'other'
  const createdAt =
    typeof raw.createdAt === 'string' ? raw.createdAt : new Date().toISOString()
  const rawDocumentDate =
    typeof raw.documentDate === 'string' || raw.documentDate === null
      ? (raw.documentDate as string | null)
      : null
  /** Prefer stored document date; otherwise default to the upload (created) day. */
  const documentDate =
    rawDocumentDate?.trim() || localDateYmd(new Date(createdAt))
  const monthKey =
    typeof raw.monthKey === 'string' || raw.monthKey === null
      ? (raw.monthKey as string | null) ??
        monthKeyFromDate(documentDate) ??
        monthKeyFromDate(createdAt)
      : monthKeyFromDate(documentDate) ?? monthKeyFromDate(createdAt)

  const tags = Array.isArray(raw.tags)
    ? (raw.tags as unknown[]).filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
    : []

  return {
    id: String(raw.id),
    fileName: typeof raw.fileName === 'string' ? raw.fileName : 'document',
    category,
    fyEndYear: typeof raw.fyEndYear === 'number' ? raw.fyEndYear : new Date().getFullYear(),
    monthKey,
    documentDate,
    description: typeof raw.description === 'string' ? raw.description : '',
    tags,
    linkedClaimId:
      typeof raw.linkedClaimId === 'string' || raw.linkedClaimId === null
        ? (raw.linkedClaimId as string | null)
        : null,
    linkedClaimLabel:
      typeof raw.linkedClaimLabel === 'string' || raw.linkedClaimLabel === null
        ? (raw.linkedClaimLabel as string | null)
        : null,
    destinationId:
      typeof raw.destinationId === 'string' || raw.destinationId === null
        ? (raw.destinationId as string | null)
        : null,
    destinationName:
      typeof raw.destinationName === 'string' || raw.destinationName === null
        ? (raw.destinationName as string | null)
        : null,
    title: typeof raw.title === 'string' ? raw.title : 'Untitled',
    mimeType: typeof raw.mimeType === 'string' ? raw.mimeType : 'application/octet-stream',
    byteSize: typeof raw.byteSize === 'number' ? raw.byteSize : 0,
    processingStatus:
      raw.processingStatus === 'queued' ||
      raw.processingStatus === 'ready' ||
      raw.processingStatus === 'failed'
        ? raw.processingStatus
        : 'ready',
    dataUrl: typeof raw.dataUrl === 'string' || raw.dataUrl === null ? raw.dataUrl : null,
    storagePath:
      typeof raw.storagePath === 'string' || raw.storagePath === null ? raw.storagePath : null,
    storageProvider:
      raw.storageProvider === 'supabase' ||
      raw.storageProvider === 'local_dev' ||
      raw.storageProvider === 'drive'
        ? raw.storageProvider
        : 'local_dev',
    storageBucket: typeof raw.storageBucket === 'string' ? raw.storageBucket : 'evidence',
    driveFileId: null,
    driveParentFolderId: null,
    driveMirrorStatus: 'not_mirrored',
    softDeletedAt:
      typeof raw.softDeletedAt === 'string' || raw.softDeletedAt === null
        ? (raw.softDeletedAt as string | null)
        : null,
    createdAt,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : createdAt,
  }
}
