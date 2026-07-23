import { getSupabase, isSupabaseConfigured } from '@/shared/lib/supabase'
import { getIngestProvider } from '@/shared/integrations/ingest-provider'
import type {
  EvidenceRecord,
  EvidenceUploadInput,
  EvidenceCategory,
  EvidenceMetadataPatch,
} from '@/features/evidence/types/evidence'
import { isEvidenceCategory } from '@/features/evidence/types/evidence'
import {
  monthKeyFromDate,
  normalizeEvidenceRecord,
  localDateYmd,
} from '@/features/evidence/utils/normalize-evidence'

const LOCAL_KEY = 'ajx.evidence.vault.v2'
const BUCKET = 'evidence'
const MAX_LOCAL_BYTES = 4 * 1024 * 1024

function readLocal(): EvidenceRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as EvidenceRecord[]
    return parsed.map((row) => normalizeEvidenceRecord(row as EvidenceRecord & Record<string, unknown>))
  } catch {
    return []
  }
}

function writeLocal(items: EvidenceRecord[]) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(items))
  } catch (err) {
    const name = err instanceof DOMException ? err.name : ''
    if (name === 'QuotaExceededError' || name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      throw Object.assign(new Error('Browser storage is full'), { code: 'UPLOAD_FAILED' })
    }
    throw Object.assign(new Error('Could not save evidence'), { code: 'SAVE_FAILED' })
  }
}

function readAsDataUrl(file: File): Promise<string> {
  if (file.size > MAX_LOCAL_BYTES) {
    return Promise.reject(
      Object.assign(
        new Error(
          'File is too large for local storage (max 4 MB). Configure Supabase for larger files.',
        ),
        { code: 'UPLOAD_FAILED' },
      ),
    )
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

function baseTitle(fileName: string) {
  return fileName.replace(/\.[^.]+$/, '') || fileName
}

function resolveMonthKey(documentDate: string | null, fallbackIso: string, explicit?: string | null) {
  if (explicit) return explicit
  return monthKeyFromDate(documentDate) ?? monthKeyFromDate(fallbackIso)
}

/** Active (non-deleted) evidence for a financial year. */
export function listEvidenceRecords(fyEndYear: number): EvidenceRecord[] {
  return readLocal()
    .filter((i) => !i.softDeletedAt && i.fyEndYear === fyEndYear)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function getEvidenceRecord(id: string): EvidenceRecord | null {
  return readLocal().find((i) => i.id === id) ?? null
}

export async function uploadEvidence(input: EvidenceUploadInput): Promise<EvidenceRecord> {
  const id = crypto.randomUUID()
  const now = new Date().toISOString()
  const title = input.title?.trim() || baseTitle(input.file.name)
  const mimeType = input.file.type || 'application/octet-stream'
  const tags = input.tags ?? []
  /** Default document date to the upload day; callers / users may override. */
  const documentDate = input.documentDate?.trim() || localDateYmd()
  const monthKey = resolveMonthKey(documentDate, now, input.monthKey)
  const destinationId = input.destinationId ?? null
  const destinationName = input.destinationName ?? null

  // Extension point only — NoopIngestProvider marks ready immediately (no OCR / analysis).
  const ingest = await getIngestProvider().processDocument({
    evidenceId: id,
    mimeType,
  })

  const supabase = getSupabase()
  let storagePath: string | null = null
  let storageProvider: EvidenceRecord['storageProvider'] = 'local_dev'
  let dataUrl: string | null = null

  if (supabase && isSupabaseConfigured) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      dataUrl = await readAsDataUrl(input.file)
    } else {
      storagePath = `${user.id}/${input.fyEndYear}/${id}/${input.file.name}`
      const { error } = await supabase.storage.from(BUCKET).upload(storagePath, input.file, {
        contentType: mimeType,
        upsert: false,
      })
      if (error) {
        throw Object.assign(new Error(error.message), { code: 'UPLOAD_FAILED' })
      }
      storageProvider = 'supabase'

      await supabase.from('evidence_items').upsert({
        id,
        user_id: user.id,
        fy_end_year: input.fyEndYear,
        title,
        category: input.category,
        file_name: input.file.name,
        description: input.description,
        document_date: documentDate,
        linked_claim_id: input.linkedClaimId,
        linked_claim_label: input.linkedClaimLabel,
        processing_status: ingest.status === 'failed' ? 'failed' : 'ready',
        notes: input.description,
        created_at: now,
        updated_at: now,
      })
      await supabase.from('evidence_files').insert({
        id: crypto.randomUUID(),
        user_id: user.id,
        evidence_item_id: id,
        file_name: input.file.name,
        mime_type: mimeType,
        byte_size: input.file.size,
        storage_path: storagePath,
        storage_provider: 'supabase',
        storage_bucket: BUCKET,
        drive_mirror_status: 'not_mirrored',
        created_at: now,
      })
    }
  } else {
    dataUrl = await readAsDataUrl(input.file)
  }

  const record: EvidenceRecord = {
    id,
    fileName: input.file.name,
    category: input.category,
    fyEndYear: input.fyEndYear,
    monthKey,
    documentDate,
    description: input.description,
    tags,
    linkedClaimId: input.linkedClaimId,
    linkedClaimLabel: input.linkedClaimLabel,
    destinationId,
    destinationName,
    title,
    mimeType,
    byteSize: input.file.size,
    processingStatus: ingest.status === 'failed' ? 'failed' : 'ready',
    dataUrl,
    storagePath,
    storageProvider,
    storageBucket: BUCKET,
    driveFileId: null,
    driveParentFolderId: null,
    driveMirrorStatus: 'not_mirrored',
    softDeletedAt: null,
    createdAt: now,
    updatedAt: now,
  }

  const items = readLocal()
  items.unshift(record)
  writeLocal(items)
  return record
}

export function updateEvidenceRecord(
  id: string,
  patch: EvidenceMetadataPatch,
): EvidenceRecord | null {
  const items = readLocal()
  const idx = items.findIndex((i) => i.id === id)
  if (idx < 0) return null
  const current = items[idx]!

  const nextDocumentDate =
    patch.documentDate !== undefined ? patch.documentDate : current.documentDate
  let nextMonthKey = patch.monthKey !== undefined ? patch.monthKey : current.monthKey
  if (patch.documentDate !== undefined && patch.monthKey === undefined) {
    nextMonthKey =
      monthKeyFromDate(nextDocumentDate) ?? monthKeyFromDate(current.createdAt) ?? current.monthKey
  }

  const next: EvidenceRecord = {
    ...current,
    ...patch,
    category: patch.category
      ? isEvidenceCategory(patch.category)
        ? patch.category
        : current.category
      : current.category,
    documentDate: nextDocumentDate,
    monthKey: nextMonthKey,
    tags: patch.tags ?? current.tags,
    fileName: patch.fileName?.trim() || current.fileName,
    updatedAt: new Date().toISOString(),
  }
  items[idx] = next
  writeLocal(items)
  void syncMetadataToSupabase(next)
  return next
}

/** Replace the binary file while keeping the same evidence id and metadata (unless filename changes). */
export async function replaceEvidenceFile(
  id: string,
  file: File,
): Promise<EvidenceRecord | null> {
  const items = readLocal()
  const idx = items.findIndex((i) => i.id === id)
  if (idx < 0) return null
  const current = items[idx]!
  const now = new Date().toISOString()
  const mimeType = file.type || 'application/octet-stream'

  const supabase = getSupabase()
  let storagePath = current.storagePath
  let storageProvider = current.storageProvider
  let dataUrl: string | null | undefined = current.dataUrl

  if (supabase && isSupabaseConfigured && current.storageProvider === 'supabase') {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const nextPath = `${user.id}/${current.fyEndYear}/${id}/${file.name}`
      if (current.storagePath) {
        await supabase.storage.from(current.storageBucket || BUCKET).remove([current.storagePath])
      }
      const { error } = await supabase.storage.from(BUCKET).upload(nextPath, file, {
        contentType: mimeType,
        upsert: true,
      })
      if (error) {
        throw Object.assign(new Error(error.message), { code: 'UPLOAD_FAILED' })
      }
      storagePath = nextPath
      storageProvider = 'supabase'
      dataUrl = null
      await supabase
        .from('evidence_files')
        .update({
          file_name: file.name,
          mime_type: mimeType,
          byte_size: file.size,
          storage_path: nextPath,
        })
        .eq('evidence_item_id', id)
        .eq('user_id', user.id)
    } else {
      dataUrl = await readAsDataUrl(file)
      storageProvider = 'local_dev'
      storagePath = null
    }
  } else {
    dataUrl = await readAsDataUrl(file)
    storageProvider = 'local_dev'
    storagePath = null
  }

  const next: EvidenceRecord = {
    ...current,
    fileName: file.name,
    title: current.title || baseTitle(file.name),
    mimeType,
    byteSize: file.size,
    dataUrl,
    storagePath,
    storageProvider,
    processingStatus: 'ready',
    updatedAt: now,
  }
  items[idx] = next
  writeLocal(items)
  void syncMetadataToSupabase(next)
  return next
}

async function syncMetadataToSupabase(record: EvidenceRecord) {
  const supabase = getSupabase()
  if (!supabase || !isSupabaseConfigured) return
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return
  await supabase
    .from('evidence_items')
    .update({
      title: record.title,
      category: record.category,
      file_name: record.fileName,
      description: record.description,
      document_date: record.documentDate,
      linked_claim_id: record.linkedClaimId,
      linked_claim_label: record.linkedClaimLabel,
      fy_end_year: record.fyEndYear,
      updated_at: record.updatedAt,
      soft_deleted_at: record.softDeletedAt,
    })
    .eq('id', record.id)
    .eq('user_id', user.id)
}

export function softDeleteEvidenceRecord(id: string): EvidenceRecord | null {
  const items = readLocal()
  const item = items.find((i) => i.id === id)
  if (!item) return null
  item.softDeletedAt = new Date().toISOString()
  item.updatedAt = item.softDeletedAt
  writeLocal(items)
  void syncMetadataToSupabase(item)
  // Keep binary so undo works. Hard delete / retention can purge later.
  return item
}

export function restoreEvidenceRecord(id: string): void {
  const items = readLocal()
  const item = items.find((i) => i.id === id)
  if (!item) return
  item.softDeletedAt = null
  item.updatedAt = new Date().toISOString()
  writeLocal(items)
  void syncMetadataToSupabase(item)
}

export async function getEvidenceDownloadUrl(record: EvidenceRecord): Promise<string | null> {
  if (record.dataUrl) return record.dataUrl
  if (!record.storagePath) return null
  const supabase = getSupabase()
  if (!supabase) return null
  const { data, error } = await supabase.storage
    .from(record.storageBucket || BUCKET)
    .createSignedUrl(record.storagePath, 60 * 10)
  if (error || !data?.signedUrl) return null
  return data.signedUrl
}

export async function downloadEvidenceFile(record: EvidenceRecord): Promise<void> {
  const url = await getEvidenceDownloadUrl(record)
  if (!url) {
    throw Object.assign(new Error('File not available'), { code: 'NOT_FOUND' })
  }
  const a = document.createElement('a')
  a.href = url
  a.download = record.fileName
  a.rel = 'noopener'
  a.target = '_blank'
  document.body.appendChild(a)
  a.click()
  a.remove()
}

export function upsertImportedEvidenceRecord(input: {
  id: string
  fyEndYear: number | null
  title: string
  category: string
  description: string
  fileName?: string
  mimeType?: string
}): EvidenceRecord {
  const now = new Date().toISOString()
  const category = isEvidenceCategory(input.category) ? input.category : 'other'
  const record = normalizeEvidenceRecord({
    id: input.id,
    fileName: input.fileName ?? `${input.title}.txt`,
    category,
    fyEndYear: input.fyEndYear ?? currentFyFallback(),
    monthKey: monthKeyFromDate(now),
    documentDate: null,
    description: input.description,
    tags: [],
    linkedClaimId: null,
    linkedClaimLabel: null,
    destinationId: null,
    destinationName: null,
    title: input.title,
    mimeType: input.mimeType ?? 'application/octet-stream',
    byteSize: 0,
    processingStatus: 'ready',
    dataUrl: null,
    storagePath: null,
    storageProvider: 'local_dev',
    storageBucket: BUCKET,
    driveFileId: null,
    driveParentFolderId: null,
    driveMirrorStatus: 'not_mirrored',
    softDeletedAt: null,
    createdAt: now,
    updatedAt: now,
  })
  const items = readLocal()
  const idx = items.findIndex((i) => i.id === record.id)
  if (idx >= 0) items[idx] = { ...items[idx]!, ...record, createdAt: items[idx]!.createdAt }
  else items.unshift(record)
  writeLocal(items)
  return record
}

function currentFyFallback(): number {
  const month = new Date().getMonth()
  const year = new Date().getFullYear()
  return month >= 6 ? year + 1 : year
}

export type EvidenceFilterOpts = {
  query: string
  category: EvidenceCategory | 'all'
  monthKey: string | 'all'
  destinationId: string | 'all'
  tag: string | 'all'
}

export function filterEvidence(
  items: EvidenceRecord[],
  opts: EvidenceFilterOpts,
): EvidenceRecord[] {
  const q = opts.query.trim().toLowerCase()
  return items.filter((item) => {
    if (opts.category !== 'all' && item.category !== opts.category) return false
    if (opts.monthKey !== 'all' && item.monthKey !== opts.monthKey) return false
    if (opts.destinationId !== 'all' && item.destinationId !== opts.destinationId) return false
    if (opts.tag !== 'all' && !item.tags.includes(opts.tag)) return false
    if (!q) return true
    return (
      item.title.toLowerCase().includes(q) ||
      item.fileName.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.tags.some((t) => t.includes(q)) ||
      (item.destinationName?.toLowerCase().includes(q) ?? false) ||
      (item.linkedClaimLabel?.toLowerCase().includes(q) ?? false)
    )
  })
}
