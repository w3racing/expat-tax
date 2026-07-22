import { describe, expect, it } from 'vitest'
import { filterEvidence } from '@/features/evidence/services/evidence-vault'
import type { EvidenceRecord } from '@/features/evidence/types/evidence'
import {
  monthKeyFromDate,
  normalizeEvidenceRecord,
  parseTagsInput,
} from '@/features/evidence/utils/normalize-evidence'
import { storageLocationLabel } from '@/features/evidence/types/evidence'

function sample(partial: Partial<EvidenceRecord> & Pick<EvidenceRecord, 'id' | 'title'>): EvidenceRecord {
  return normalizeEvidenceRecord({
    id: partial.id,
    fileName: partial.fileName ?? 'doc.pdf',
    category: partial.category ?? 'receipt',
    fyEndYear: partial.fyEndYear ?? 2026,
    monthKey: partial.monthKey ?? '2025-09',
    documentDate: partial.documentDate ?? '2025-09-12',
    description: partial.description ?? '',
    tags: partial.tags ?? [],
    linkedClaimId: partial.linkedClaimId ?? null,
    linkedClaimLabel: partial.linkedClaimLabel ?? null,
    destinationId: partial.destinationId ?? null,
    destinationName: partial.destinationName ?? null,
    title: partial.title,
    mimeType: partial.mimeType ?? 'application/pdf',
    byteSize: partial.byteSize ?? 100,
    processingStatus: 'ready',
    dataUrl: null,
    storagePath: partial.storagePath ?? null,
    storageProvider: partial.storageProvider ?? 'local_dev',
    storageBucket: 'evidence',
    driveFileId: null,
    driveParentFolderId: null,
    driveMirrorStatus: 'not_mirrored',
    softDeletedAt: null,
    createdAt: partial.createdAt ?? '2025-09-12T10:00:00.000Z',
    updatedAt: partial.updatedAt ?? '2025-09-12T10:00:00.000Z',
  })
}

describe('normalizeEvidenceRecord', () => {
  it('fills tags, month, and destination defaults for legacy rows', () => {
    const row = normalizeEvidenceRecord({
      id: '1',
      fileName: 'a.pdf',
      category: 'roster',
      fyEndYear: 2026,
      documentDate: '2025-11-03',
      description: '',
      title: 'Roster',
      mimeType: 'application/pdf',
      byteSize: 1,
      processingStatus: 'ready',
      storagePath: null,
      storageProvider: 'local_dev',
      storageBucket: 'evidence',
      driveFileId: null,
      driveParentFolderId: null,
      driveMirrorStatus: 'not_mirrored',
      softDeletedAt: null,
      createdAt: '2025-11-03T00:00:00.000Z',
      updatedAt: '2025-11-03T00:00:00.000Z',
    } as EvidenceRecord & Record<string, unknown>)

    expect(row.tags).toEqual([])
    expect(row.monthKey).toBe('2025-11')
    expect(row.destinationId).toBeNull()
  })
})

describe('parseTagsInput / monthKeyFromDate', () => {
  it('parses comma tags uniquely', () => {
    expect(parseTagsInput('Meals, layover, meals')).toEqual(['meals', 'layover'])
  })

  it('derives month keys', () => {
    expect(monthKeyFromDate('2025-07-01')).toBe('2025-07')
    expect(monthKeyFromDate(null)).toBeNull()
  })
})

describe('filterEvidence', () => {
  const items = [
    sample({
      id: 'a',
      title: 'Tokyo meal',
      category: 'receipt',
      monthKey: '2025-09',
      destinationId: 'jp',
      destinationName: 'Japan',
      tags: ['meals'],
    }),
    sample({
      id: 'b',
      title: 'July roster',
      category: 'roster',
      monthKey: '2025-07',
      destinationId: null,
      tags: [],
      description: 'Qantas roster PDF',
    }),
  ]

  it('filters by category, month, destination, tag, and search', () => {
    expect(
      filterEvidence(items, {
        query: '',
        category: 'receipt',
        monthKey: 'all',
        destinationId: 'all',
        tag: 'all',
      }),
    ).toHaveLength(1)

    expect(
      filterEvidence(items, {
        query: '',
        category: 'all',
        monthKey: '2025-07',
        destinationId: 'all',
        tag: 'all',
      })[0]?.id,
    ).toBe('b')

    expect(
      filterEvidence(items, {
        query: '',
        category: 'all',
        monthKey: 'all',
        destinationId: 'jp',
        tag: 'all',
      })[0]?.id,
    ).toBe('a')

    expect(
      filterEvidence(items, {
        query: '',
        category: 'all',
        monthKey: 'all',
        destinationId: 'all',
        tag: 'meals',
      })[0]?.id,
    ).toBe('a')

    expect(
      filterEvidence(items, {
        query: 'qantas',
        category: 'all',
        monthKey: 'all',
        destinationId: 'all',
        tag: 'all',
      })[0]?.id,
    ).toBe('b')
  })
})

describe('storageLocationLabel', () => {
  it('labels local and cloud storage', () => {
    expect(storageLocationLabel({ storageProvider: 'local_dev', storagePath: null })).toContain(
      'browser',
    )
    expect(
      storageLocationLabel({
        storageProvider: 'supabase',
        storagePath: 'u/2026/id/file.pdf',
      }),
    ).toContain('Private cloud')
  })
})
