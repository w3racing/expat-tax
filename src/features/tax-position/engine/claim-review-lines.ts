import { CAR_KM_ANNUAL_MAX } from '@/features/tax-position/engine/constants'
import { claimAud, foreignToAud } from '@/features/tax-position/engine/math'
import type {
  ClaimReviewLine,
  TaxYearRecord,
  TransportKind,
} from '@/features/tax-position/engine/types'

/** Stable order for Transport sub-groups in Position drill-in. */
const TRANSPORT_GROUP_ORDER: readonly string[] = ['train', 'bus', 'taxi', 'other']

function transportGroup(kind?: TransportKind): { key: string; label: string } {
  if (kind === 'train') return { key: 'train', label: 'Train' }
  if (kind === 'bus') return { key: 'bus', label: 'Bus' }
  if (kind === 'taxi') return { key: 'taxi', label: 'Taxi' }
  return { key: 'other', label: 'Other transport' }
}

/** Foreign claim with no snapshotted rate (and no manual AUD override). */
function isFxPending(opts: {
  exchangeRate: number
  manualAud?: boolean
  amountAud?: number
}): boolean {
  if (opts.manualAud && typeof opts.amountAud === 'number') return false
  return !(opts.exchangeRate > 0)
}

function foreignCurrencyNote(
  currencyCode: string,
  localAmount: number,
  pending: boolean,
): string | undefined {
  const code = currencyCode.toUpperCase()
  if (code === 'AUD') return undefined
  const base = `${code} ${localAmount}`
  return pending ? `${base} · Pending ATO rate` : base
}

function sortByDate(a: ClaimReviewLine, b: ClaimReviewLine): number {
  const ad = a.dateYmd ?? ''
  const bd = b.dateYmd ?? ''
  if (ad && bd) return ad.localeCompare(bd) || a.description.localeCompare(b.description)
  if (ad) return -1
  if (bd) return 1
  return a.description.localeCompare(b.description)
}

function sortTransportLines(a: ClaimReviewLine, b: ClaimReviewLine): number {
  const ai = TRANSPORT_GROUP_ORDER.indexOf(a.groupKey ?? 'other')
  const bi = TRANSPORT_GROUP_ORDER.indexOf(b.groupKey ?? 'other')
  const ar = ai === -1 ? TRANSPORT_GROUP_ORDER.length : ai
  const br = bi === -1 ? TRANSPORT_GROUP_ORDER.length : bi
  if (ar !== br) return ar - br
  return sortByDate(a, b)
}

/** Work / flights / transport / car km / laundry / apartment — line-level review. */
export function buildClaimReviewLines(year: TaxYearRecord): ClaimReviewLine[] {
  const lines: ClaimReviewLine[] = []

  for (const c of year.otherClaims) {
    const pendingAud = isFxPending({
      exchangeRate: c.exchangeRate,
      manualAud: c.manualAud,
      amountAud: c.amountAud,
    })
    lines.push({
      id: c.id,
      category: 'work',
      dateYmd: c.dateYmd,
      description: c.description?.trim() || 'Work-related expense',
      amountAud: claimAud(c.localAmount, c.exchangeRate, c.workPercentage, {
        manualAud: c.manualAud,
        amountAud: c.amountAud,
      }),
      currencyNote: foreignCurrencyNote(c.currencyCode, c.localAmount, pendingAud),
      pendingAud,
    })
  }

  for (const c of year.flights) {
    const pendingAud = isFxPending({
      exchangeRate: c.exchangeRate,
      manualAud: c.manualAud,
    })
    lines.push({
      id: c.id,
      category: 'flight',
      dateYmd: c.dateYmd,
      description: c.description?.trim() || 'Flight',
      amountAud: claimAud(c.localAmount, c.exchangeRate, c.workPercentage),
      currencyNote: foreignCurrencyNote(c.currencyCode, c.localAmount, pendingAud),
      pendingAud,
    })
  }

  for (const c of year.transport) {
    const group = transportGroup(c.kind)
    const pendingAud = isFxPending({
      exchangeRate: c.exchangeRate,
      manualAud: c.manualAud,
      amountAud: c.audAmount,
    })
    lines.push({
      id: c.id,
      category: 'transport',
      dateYmd: c.dateYmd,
      description: c.description?.trim() || group.label,
      amountAud: claimAud(c.localAmount, c.exchangeRate, c.workPercentage, {
        manualAud: c.manualAud,
        amountAud: c.audAmount,
      }),
      currencyNote: foreignCurrencyNote(c.currencyCode, c.localAmount, pendingAud),
      pendingAud,
      groupKey: group.key,
      groupLabel: group.label,
    })
  }

  let remainingCarKm = CAR_KM_ANNUAL_MAX
  for (const c of year.carKm) {
    const claimable = Math.min(c.kilometres, remainingCarKm)
    remainingCarKm -= claimable
    lines.push({
      id: c.id,
      category: 'car-km',
      dateYmd: c.dateYmd,
      description: c.description?.trim() || `${c.kilometres} km @ ${c.centsPerKm}¢`,
      amountAud: (claimable * c.centsPerKm) / 100,
    })
  }

  for (const c of year.laundry) {
    const pendingAud = isFxPending({
      exchangeRate: c.exchangeRate,
      manualAud: c.manualAud,
      amountAud: undefined,
    })
    lines.push({
      id: c.id,
      category: 'laundry',
      dateYmd: c.dateYmd,
      description: c.description?.trim() || 'Laundry',
      amountAud: foreignToAud(c.localAmount, c.exchangeRate),
      currencyNote: foreignCurrencyNote('JPY', c.localAmount, pendingAud),
      pendingAud,
    })
  }

  for (const c of year.apartmentCosts) {
    const pendingAud = isFxPending({
      exchangeRate: c.exchangeRate,
      manualAud: c.manualAud,
      amountAud: undefined,
    })
    lines.push({
      id: c.id,
      category: 'apartment',
      dateYmd: c.dateYmd,
      description: c.description?.trim() || c.kind,
      amountAud: foreignToAud(c.localAmount, c.exchangeRate),
      currencyNote: foreignCurrencyNote('JPY', c.localAmount, pendingAud),
      pendingAud,
    })
  }

  return lines.sort(sortByDate)
}

export function claimReviewLinesForCategory(
  year: TaxYearRecord,
  category: ClaimReviewLine['category'],
): ClaimReviewLine[] {
  const lines = buildClaimReviewLines(year).filter((l) => l.category === category)
  if (category === 'transport') return lines.sort(sortTransportLines)
  return lines
}
