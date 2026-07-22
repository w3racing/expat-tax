import type {
  CanonicalEvidence,
  CanonicalImportBundle,
  DuplicateReport,
  ExistingVaultIndex,
} from '@/features/migration/types/import'

export function fuzzyEvidenceKey(item: CanonicalEvidence): string {
  const date = item.occurredOn ?? ''
  const amount = item.amount != null ? item.amount.toFixed(2) : ''
  const merchant = (item.merchant ?? item.title).trim().toLowerCase()
  return `${date}|${amount}|${merchant}`
}

export function detectDuplicates(
  bundle: CanonicalImportBundle,
  existing: ExistingVaultIndex,
): DuplicateReport {
  const matches: DuplicateReport['matches'] = []

  for (const item of bundle.evidence) {
    if (existing.legacyIds.has(item.legacyId)) {
      matches.push({
        entityType: 'evidence',
        legacyId: item.legacyId,
        title: item.title,
        method: 'legacy_id',
        confidence: 1,
      })
      continue
    }

    if (item.checksumSha256 && existing.checksums.has(item.checksumSha256)) {
      matches.push({
        entityType: 'evidence',
        legacyId: item.legacyId,
        title: item.title,
        method: 'checksum',
        confidence: 0.99,
      })
      continue
    }

    const fuzzy = fuzzyEvidenceKey(item)
    if (fuzzy !== '||' && existing.fuzzyKeys.has(fuzzy)) {
      matches.push({
        entityType: 'evidence',
        legacyId: item.legacyId,
        title: item.title,
        method: 'fuzzy',
        confidence: 0.7,
      })
    }
  }

  for (const employer of bundle.employers) {
    if (existing.legacyIds.has(employer.legacyId)) {
      matches.push({
        entityType: 'employer',
        legacyId: employer.legacyId,
        title: employer.name,
        method: 'legacy_id',
        confidence: 1,
      })
    }
  }

  return { matches }
}
