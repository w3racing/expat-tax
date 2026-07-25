import type { EvidenceRecord } from '@/features/evidence/types/evidence'
import type { SampleDay } from '@/features/destination-workspace/types/sample-day'
import type { TaxDestination, TaxYearRecord } from '@/features/tax-position/engine/types'
import { AUDIT_ZIP_SECTIONS, type AuditZipSection } from '@/features/audit/types/audit-package'

export type TravelTransportFolder = 'Airfares' | 'Bus' | 'Train' | 'Taxi' | 'Other'

/**
 * Map Evidence Vault documents into ATO package folders.
 * Does not change claim maths — organisational only.
 */
export function auditSectionForEvidence(
  record: EvidenceRecord,
  year: TaxYearRecord | undefined,
): AuditZipSection {
  const claimId = record.linkedClaimId

  if (record.category === 'payslip') return '02 Income'
  if (record.category === 'roster') return '04 Rosters'
  if (record.category === 'investment') return '06 Investments'
  if (record.category === 'flight' || record.category === 'travel') return '03 Travel'

  if (year && claimId) {
    if (year.apartmentCosts.some((c) => c.id === claimId)) return '05 Apartment'
    if (
      year.flights.some((c) => c.id === claimId) ||
      year.transport.some((c) => c.id === claimId)
    ) {
      return '03 Travel'
    }
    if (
      year.dividends.some((c) => c.id === claimId) ||
      year.capitalGains.some((c) => c.id === claimId) ||
      year.otherInvestments.some((c) => c.id === claimId)
    ) {
      return '06 Investments'
    }
    if (year.monthlyIncome.some((m) => m.id === claimId)) return '02 Income'
  }

  if (record.destinationId || record.destinationName) return '03 Travel'

  if (record.category === 'receipt' || record.category === 'screenshot') {
    return '07 Other Deductions'
  }

  return '07 Other Deductions'
}

/** Safe single folder segment for ZIP paths. */
export function safeFolderName(name: string): string {
  const cleaned = name
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
  return cleaned || 'Unassigned'
}

/** Folder name from the sample day label (falls back to a dated name). */
export function sampleDayFolderName(day: Pick<SampleDay, 'label' | 'createdAt'>): string {
  const label = day.label?.trim()
  if (label) return safeFolderName(label)
  const dateBit = day.createdAt?.slice(0, 10)
  return safeFolderName(dateBit ? `Sample day ${dateBit}` : 'Sample day')
}

export function inferTransportFolderFromText(text: string): TravelTransportFolder | null {
  const t = text.toLowerCase()
  if (
    /\b(airfare|air fare|airfares|flight|flights|boarding|airline|airlines|qantas|jetstar|virgin|ana |jal |itinerary)\b/.test(
      t,
    )
  ) {
    return 'Airfares'
  }
  if (/\b(uber|taxi|cab|cabs|didi|ola|ride[\s-]?share|rideshare)\b/.test(t)) return 'Taxi'
  if (/\b(bus|buses|coach|coaches)\b/.test(t)) return 'Bus'
  if (/\b(train|trains|rail|railway|jr |metro|subway|tram)\b/.test(t)) return 'Train'
  return null
}

function resolveDestinationName(
  record: EvidenceRecord,
  destinations: TaxDestination[],
): string | null {
  if (record.destinationName?.trim()) return record.destinationName.trim()
  if (record.destinationId) {
    const match = destinations.find((d) => d.id === record.destinationId)
    if (match?.name?.trim()) return match.name.trim()
  }
  return null
}

/** Find the sample day that links this Evidence Vault document. */
export function findSampleDayForEvidence(
  evidenceId: string,
  sampleDays: SampleDay[],
): SampleDay | null {
  for (const day of sampleDays) {
    if (day.linkedEvidenceIds.includes(evidenceId)) return day
    if (day.receipts.some((r) => r.evidenceId === evidenceId)) return day
  }
  return null
}

function destinationFolder(
  destName: string,
  sampleDay: SampleDay | null,
): string {
  const base = `Destinations/${safeFolderName(destName)}`
  if (!sampleDay) return base
  return `${base}/${sampleDayFolderName(sampleDay)}`
}

/**
 * Relative path under `03 Travel/` for destination vs transport organisation.
 *
 * Priority:
 * 1. Flight claims / flight category → Transport/Airfares
 * 2. Explicit transport claim by kind → Transport/{Kind}
 * 3. Sample-day linked evidence → Destinations/{Name}/{Sample day label}
 * 4. Text inference (Uber, flight labels, etc.)
 * 5. Destination only → Destinations/{Name}
 * 6. General
 */
export function travelSubfolderForEvidence(
  record: EvidenceRecord,
  year: TaxYearRecord | undefined,
  destinations: TaxDestination[],
  sampleDays: SampleDay[] = [],
): string {
  const claimId = record.linkedClaimId
  const blob = [record.title, record.description, record.linkedClaimLabel, record.fileName]
    .filter(Boolean)
    .join(' ')

  if (record.category === 'flight') return 'Transport/Airfares'
  if (year && claimId && year.flights.some((c) => c.id === claimId)) {
    return 'Transport/Airfares'
  }

  if (year && claimId) {
    const transport = year.transport.find((c) => c.id === claimId)
    if (transport) {
      if (transport.kind === 'bus') return 'Transport/Bus'
      if (transport.kind === 'train') return 'Transport/Train'
      if (transport.kind === 'taxi') return 'Transport/Taxi'
      const fromClaim = inferTransportFolderFromText(
        [transport.description, transport.kind, record.linkedClaimLabel].filter(Boolean).join(' '),
      )
      if (fromClaim) return `Transport/${fromClaim}`
      return 'Transport/Other'
    }
  }

  const sampleDay = findSampleDayForEvidence(record.id, sampleDays)
  const destFromRecord = resolveDestinationName(record, destinations)
  const destFromSample = sampleDay
    ? destinations.find((d) => d.id === sampleDay.destinationId)?.name?.trim() ?? null
    : null
  const destName = destFromRecord ?? destFromSample

  if (sampleDay && destName) {
    return destinationFolder(destName, sampleDay)
  }

  const inferred = inferTransportFolderFromText(blob)
  if (inferred) return `Transport/${inferred}`

  if (destName) return destinationFolder(destName, null)

  // Travel-category docs without a clearer home
  if (record.category === 'travel') return 'General'

  return 'General'
}

export function travelSubfolderForSampleDay(
  day: Pick<SampleDay, 'label' | 'createdAt'>,
  destinationName: string | null | undefined,
): string {
  const dest = destinationName?.trim() ? safeFolderName(destinationName) : 'Unassigned'
  return `Destinations/${dest}/${sampleDayFolderName(day)}`
}

/**
 * Full ZIP folder path for a document (section + optional Travel subfolders).
 */
export function auditZipFolderForEvidence(
  record: EvidenceRecord,
  year: TaxYearRecord | undefined,
  destinations: TaxDestination[],
  sampleDays: SampleDay[] = [],
): string {
  const section = auditSectionForEvidence(record, year)
  if (section !== '03 Travel') return section
  return `03 Travel/${travelSubfolderForEvidence(record, year, destinations, sampleDays)}`
}

export function emptySectionPlaceholder(section: AuditZipSection): string {
  return [
    `AJX Tax — ${section}`,
    '',
    'None for this financial year.',
    '',
    'This folder is included deliberately so the package structure is complete and nothing is silently omitted.',
    '',
  ].join('\n')
}

export function travelFolderReadme(): string {
  return [
    'AJX Tax — 03 Travel',
    '',
    'Evidence is organised as:',
    '',
    '  Destinations/',
    '    {Destination name}/',
    '      {Sample day label}/  — receipts and evidence linked to that sample day',
    '      (root)              — destination-linked documents not tied to a sample day',
    '',
    '  Transport/',
    '    Airfares/             — flight claims and flight documents',
    '    Bus/',
    '    Train/',
    '    Taxi/                 — includes Uber / ride-share when inferred or tagged as taxi',
    '    Other/                — transport claims without a specific kind',
    '',
    '  General/                — travel documents that are not destination- or transport-linked',
    '',
    'Overnight counts remain the source of truth. Rosters stay in 04 Rosters.',
    '',
  ].join('\n')
}

export function sectionFolderNames(): readonly AuditZipSection[] {
  return AUDIT_ZIP_SECTIONS
}
