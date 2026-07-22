import { lookupAtoRateForMonth } from '@/features/tax-position/engine'

export type ResolvedFx = {
  exchangeRate: number
  rateFromAto: boolean
  missingAtoRate: boolean
}

/** Resolve snapshotted FX for a claim date. AUD = 1. Foreign = ATO units per A$1 for that month. */
export function resolveFxForClaim(currencyCode: string, dateYmd: string): ResolvedFx {
  const code = currencyCode.toUpperCase()
  if (code === 'AUD') {
    return { exchangeRate: 1, rateFromAto: false, missingAtoRate: false }
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateYmd.trim())
  if (!match) {
    return { exchangeRate: 0, rateFromAto: false, missingAtoRate: true }
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const ato = lookupAtoRateForMonth(code, year, month)
  if (!ato) {
    return { exchangeRate: 0, rateFromAto: false, missingAtoRate: true }
  }

  return {
    exchangeRate: ato.unitsPerAud,
    rateFromAto: true,
    missingAtoRate: false,
  }
}
