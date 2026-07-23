import { buildClaimReviewLines } from '@/features/tax-position/engine'
import { loadTaxPlanner } from '@/features/tax-position/services/position-service'
import { listEvidenceRecords } from '@/features/evidence/services/evidence-vault'
import { listDismissedClaimIds } from '@/features/evidence/services/dismissed-claim-gaps'

const CATEGORY_LABELS: Record<string, string> = {
  work: 'Work expense',
  flight: 'Flight',
  transport: 'Transport',
  'car-km': 'Car (cents/km)',
  laundry: 'Laundry',
  apartment: 'Apartment',
}

export type ClaimEvidenceRow = {
  id: string
  category: string
  dateYmd?: string
  description: string
  amountAud: number
  currencyNote?: string
  linkedEvidence: boolean
  dismissed: boolean
}

/** Expense claims that can be linked to evidence (excludes overnight counts). */
export function listClaimsWithEvidenceStatus(fyEndYear: number): ClaimEvidenceRow[] {
  const planner = loadTaxPlanner(fyEndYear)
  const year = planner.years.find((y) => y.fyEndYear === fyEndYear)
  if (!year) return []

  const linked = new Set(
    listEvidenceRecords(fyEndYear)
      .map((e) => e.linkedClaimId)
      .filter((id): id is string => Boolean(id)),
  )
  const dismissed = listDismissedClaimIds(fyEndYear)

  return buildClaimReviewLines(year).map((row) => ({
    id: row.id,
    category: CATEGORY_LABELS[row.category] ?? row.category,
    dateYmd: row.dateYmd,
    description: row.description,
    amountAud: row.amountAud,
    currencyNote: row.currencyNote,
    linkedEvidence: linked.has(row.id),
    dismissed: dismissed.has(row.id),
  }))
}

/** Claims with no linked evidence, excluding dismissed gaps (unless requested). */
export function listUnlinkedClaims(
  fyEndYear: number,
  options?: { includeDismissed?: boolean },
): ClaimEvidenceRow[] {
  return listClaimsWithEvidenceStatus(fyEndYear).filter((row) => {
    if (row.linkedEvidence) return false
    if (row.dismissed && !options?.includeDismissed) return false
    return true
  })
}

export function countActiveUnlinkedClaims(fyEndYear: number): number {
  return listUnlinkedClaims(fyEndYear).length
}
