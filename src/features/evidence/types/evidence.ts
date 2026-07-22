/** Evidence Vault domain types — document storage only in MVP (no AI / OCR). */

export const EVIDENCE_CATEGORIES = [
  'receipt',
  'payslip',
  'roster',
  'flight',
  'travel',
  'screenshot',
  'investment',
  'other',
] as const

export type EvidenceCategory = (typeof EVIDENCE_CATEGORIES)[number]

/** Document type labels — category is the document type in MVP. */
export const EVIDENCE_CATEGORY_LABELS: Record<EvidenceCategory, string> = {
  receipt: 'Receipt',
  payslip: 'Payslip',
  roster: 'Roster',
  flight: 'Flight',
  travel: 'Travel document',
  screenshot: 'Screenshot',
  investment: 'Investment',
  other: 'Other',
}

export type StorageProvider = 'supabase' | 'local_dev' | 'drive'
export type DriveMirrorStatus =
  | 'not_mirrored'
  | 'pending'
  | 'mirrored'
  | 'missing'
  | 'trashed'
  | 'conflict'

export type ProcessingStatus = 'queued' | 'ready' | 'failed'

export type EvidenceRecord = {
  id: string
  /** Original / download filename */
  fileName: string
  /** Document type (category) */
  category: EvidenceCategory
  fyEndYear: number
  /** YYYY-MM for organisation — from document date or upload month */
  monthKey: string | null
  /** Document date (YYYY-MM-DD) */
  documentDate: string | null
  description: string
  tags: string[]
  linkedClaimId: string | null
  linkedClaimLabel: string | null
  destinationId: string | null
  destinationName: string | null
  title: string
  mimeType: string
  byteSize: number
  processingStatus: ProcessingStatus
  /** Local preview / download when using local_dev */
  dataUrl?: string | null
  /** Supabase storage path: {userId}/{fy}/{id}/{fileName} */
  storagePath: string | null
  storageProvider: StorageProvider
  storageBucket: string
  /** Future Google Drive — null in MVP */
  driveFileId: string | null
  driveParentFolderId: string | null
  driveMirrorStatus: DriveMirrorStatus
  softDeletedAt: string | null
  /** Upload date */
  createdAt: string
  updatedAt: string
}

export type EvidenceUploadInput = {
  file: File
  category: EvidenceCategory
  fyEndYear: number
  documentDate: string | null
  monthKey?: string | null
  description: string
  tags?: string[]
  linkedClaimId: string | null
  linkedClaimLabel: string | null
  destinationId?: string | null
  destinationName?: string | null
  title?: string
}

export type EvidenceClaimOption = {
  id: string
  label: string
}

export type EvidenceDestinationOption = {
  id: string
  name: string
}

export type EvidenceMetadataPatch = Partial<
  Pick<
    EvidenceRecord,
    | 'title'
    | 'fileName'
    | 'category'
    | 'documentDate'
    | 'monthKey'
    | 'description'
    | 'tags'
    | 'linkedClaimId'
    | 'linkedClaimLabel'
    | 'destinationId'
    | 'destinationName'
    | 'fyEndYear'
  >
>

export function isEvidenceCategory(value: string): value is EvidenceCategory {
  return (EVIDENCE_CATEGORIES as readonly string[]).includes(value)
}

export function categoryLabel(category: EvidenceCategory | string): string {
  if (isEvidenceCategory(category)) return EVIDENCE_CATEGORY_LABELS[category]
  return category
}

export function storageLocationLabel(record: Pick<EvidenceRecord, 'storageProvider' | 'storagePath'>): string {
  if (record.storageProvider === 'supabase') {
    return record.storagePath ? `Private cloud · ${record.storagePath}` : 'Private cloud'
  }
  if (record.storageProvider === 'drive') {
    return 'Google Drive (not connected in MVP)'
  }
  return 'This browser (local)'
}
