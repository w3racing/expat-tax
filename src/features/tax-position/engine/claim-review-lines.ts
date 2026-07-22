import { CAR_KM_ANNUAL_MAX } from '@/features/tax-position/engine/constants'
import { claimAud, foreignToAud } from '@/features/tax-position/engine/math'
import type { ClaimReviewLine, TaxYearRecord } from '@/features/tax-position/engine/types'

function sortByDate(a: ClaimReviewLine, b: ClaimReviewLine): number {
  const ad = a.dateYmd ?? ''
  const bd = b.dateYmd ?? ''
  if (ad && bd) return ad.localeCompare(bd) || a.description.localeCompare(b.description)
  if (ad) return -1
  if (bd) return 1
  return a.description.localeCompare(b.description)
}

/** Work / flights / transport / car km / laundry / apartment — line-level review. */
export function buildClaimReviewLines(year: TaxYearRecord): ClaimReviewLine[] {
  const lines: ClaimReviewLine[] = []

  for (const c of year.otherClaims) {
    lines.push({
      id: c.id,
      category: 'work',
      dateYmd: c.dateYmd,
      description: c.description?.trim() || 'Work-related expense',
      amountAud: claimAud(c.localAmount, c.exchangeRate, c.workPercentage, {
        manualAud: c.manualAud,
        amountAud: c.amountAud,
      }),
      currencyNote: c.currencyCode !== 'AUD' ? `${c.currencyCode} ${c.localAmount}` : undefined,
    })
  }

  for (const c of year.flights) {
    lines.push({
      id: c.id,
      category: 'flight',
      dateYmd: c.dateYmd,
      description: c.description?.trim() || 'Flight',
      amountAud: claimAud(c.localAmount, c.exchangeRate, c.workPercentage),
      currencyNote: c.currencyCode !== 'AUD' ? `${c.currencyCode} ${c.localAmount}` : undefined,
    })
  }

  for (const c of year.transport) {
    const kindLabel = c.kind
      ? c.kind.charAt(0).toUpperCase() + c.kind.slice(1)
      : 'Transport'
    lines.push({
      id: c.id,
      category: 'transport',
      dateYmd: c.dateYmd,
      description: c.description?.trim() || kindLabel,
      amountAud: claimAud(c.localAmount, c.exchangeRate, c.workPercentage, {
        manualAud: c.manualAud,
        amountAud: c.audAmount,
      }),
      currencyNote: c.currencyCode !== 'AUD' ? `${c.currencyCode} ${c.localAmount}` : undefined,
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
    lines.push({
      id: c.id,
      category: 'laundry',
      dateYmd: c.dateYmd,
      description: c.description?.trim() || 'Laundry',
      amountAud: foreignToAud(c.localAmount, c.exchangeRate),
      currencyNote: `JPY ${c.localAmount}`,
    })
  }

  for (const c of year.apartmentCosts) {
    lines.push({
      id: c.id,
      category: 'apartment',
      dateYmd: c.dateYmd,
      description: c.description?.trim() || c.kind,
      amountAud: foreignToAud(c.localAmount, c.exchangeRate),
      currencyNote: `JPY ${c.localAmount}`,
    })
  }

  return lines.sort(sortByDate)
}

export function claimReviewLinesForCategory(
  year: TaxYearRecord,
  category: ClaimReviewLine['category'],
): ClaimReviewLine[] {
  return buildClaimReviewLines(year).filter((l) => l.category === category)
}
