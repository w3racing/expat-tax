import { ENGINE_VERSION } from '@/features/tax-position/engine/constants'

/** Reference ATO monthly averages — units of foreign currency per A$1. */
export type AtoExchangeRate = {
  currencyCode: string
  year: number
  month: number
  unitsPerAud: number
  sourceVersion: string
}

/**
 * Seeded MVP reference table (illustrative published averages).
 * Row snapshots on claims remain authoritative for calculation (parity rule).
 */
const ATO_RATES: AtoExchangeRate[] = [
  { currencyCode: 'USD', year: 2025, month: 7, unitsPerAud: 0.655, sourceVersion: 'ato-seed-2026.1' },
  { currencyCode: 'USD', year: 2025, month: 8, unitsPerAud: 0.652, sourceVersion: 'ato-seed-2026.1' },
  { currencyCode: 'USD', year: 2025, month: 9, unitsPerAud: 0.66, sourceVersion: 'ato-seed-2026.1' },
  { currencyCode: 'USD', year: 2025, month: 10, unitsPerAud: 0.658, sourceVersion: 'ato-seed-2026.1' },
  { currencyCode: 'USD', year: 2025, month: 11, unitsPerAud: 0.651, sourceVersion: 'ato-seed-2026.1' },
  { currencyCode: 'USD', year: 2025, month: 12, unitsPerAud: 0.645, sourceVersion: 'ato-seed-2026.1' },
  { currencyCode: 'USD', year: 2026, month: 1, unitsPerAud: 0.642, sourceVersion: 'ato-seed-2026.1' },
  { currencyCode: 'USD', year: 2026, month: 2, unitsPerAud: 0.648, sourceVersion: 'ato-seed-2026.1' },
  { currencyCode: 'USD', year: 2026, month: 3, unitsPerAud: 0.65, sourceVersion: 'ato-seed-2026.1' },
  { currencyCode: 'USD', year: 2026, month: 4, unitsPerAud: 0.653, sourceVersion: 'ato-seed-2026.1' },
  { currencyCode: 'USD', year: 2026, month: 5, unitsPerAud: 0.657, sourceVersion: 'ato-seed-2026.1' },
  { currencyCode: 'USD', year: 2026, month: 6, unitsPerAud: 0.66, sourceVersion: 'ato-seed-2026.1' },
  { currencyCode: 'JPY', year: 2025, month: 7, unitsPerAud: 97.5, sourceVersion: 'ato-seed-2026.1' },
  { currencyCode: 'JPY', year: 2025, month: 8, unitsPerAud: 96.8, sourceVersion: 'ato-seed-2026.1' },
  { currencyCode: 'JPY', year: 2025, month: 9, unitsPerAud: 97.2, sourceVersion: 'ato-seed-2026.1' },
  { currencyCode: 'JPY', year: 2025, month: 10, unitsPerAud: 98.1, sourceVersion: 'ato-seed-2026.1' },
  { currencyCode: 'JPY', year: 2025, month: 11, unitsPerAud: 97.0, sourceVersion: 'ato-seed-2026.1' },
  { currencyCode: 'JPY', year: 2025, month: 12, unitsPerAud: 96.5, sourceVersion: 'ato-seed-2026.1' },
  { currencyCode: 'JPY', year: 2026, month: 1, unitsPerAud: 97.4, sourceVersion: 'ato-seed-2026.1' },
  { currencyCode: 'JPY', year: 2026, month: 2, unitsPerAud: 98.0, sourceVersion: 'ato-seed-2026.1' },
  { currencyCode: 'JPY', year: 2026, month: 3, unitsPerAud: 97.6, sourceVersion: 'ato-seed-2026.1' },
  { currencyCode: 'JPY', year: 2026, month: 4, unitsPerAud: 96.9, sourceVersion: 'ato-seed-2026.1' },
  { currencyCode: 'JPY', year: 2026, month: 5, unitsPerAud: 97.1, sourceVersion: 'ato-seed-2026.1' },
  { currencyCode: 'JPY', year: 2026, month: 6, unitsPerAud: 97.8, sourceVersion: 'ato-seed-2026.1' },
  { currencyCode: 'EUR', year: 2025, month: 7, unitsPerAud: 0.605, sourceVersion: 'ato-seed-2026.1' },
  { currencyCode: 'EUR', year: 2025, month: 8, unitsPerAud: 0.61, sourceVersion: 'ato-seed-2026.1' },
  { currencyCode: 'EUR', year: 2025, month: 9, unitsPerAud: 0.608, sourceVersion: 'ato-seed-2026.1' },
  { currencyCode: 'EUR', year: 2025, month: 10, unitsPerAud: 0.612, sourceVersion: 'ato-seed-2026.1' },
  { currencyCode: 'EUR', year: 2025, month: 11, unitsPerAud: 0.615, sourceVersion: 'ato-seed-2026.1' },
  { currencyCode: 'EUR', year: 2025, month: 12, unitsPerAud: 0.618, sourceVersion: 'ato-seed-2026.1' },
  { currencyCode: 'EUR', year: 2026, month: 1, unitsPerAud: 0.61, sourceVersion: 'ato-seed-2026.1' },
  { currencyCode: 'EUR', year: 2026, month: 2, unitsPerAud: 0.607, sourceVersion: 'ato-seed-2026.1' },
  { currencyCode: 'EUR', year: 2026, month: 3, unitsPerAud: 0.609, sourceVersion: 'ato-seed-2026.1' },
  { currencyCode: 'EUR', year: 2026, month: 4, unitsPerAud: 0.611, sourceVersion: 'ato-seed-2026.1' },
  { currencyCode: 'EUR', year: 2026, month: 5, unitsPerAud: 0.614, sourceVersion: 'ato-seed-2026.1' },
  { currencyCode: 'EUR', year: 2026, month: 6, unitsPerAud: 0.616, sourceVersion: 'ato-seed-2026.1' },
]

export function listAtoCurrencies(): string[] {
  return [...new Set(ATO_RATES.map((r) => r.currencyCode))].sort()
}

export function getAtoExchangeRate(
  currencyCode: string,
  year: number,
  month: number,
): AtoExchangeRate | undefined {
  return ATO_RATES.find(
    (r) =>
      r.currencyCode === currencyCode.toUpperCase() && r.year === year && r.month === month,
  )
}

export function lookupAtoRateForMonth(
  currencyCode: string,
  year: number,
  month: number,
): AtoExchangeRate | null {
  return getAtoExchangeRate(currencyCode, year, month) ?? null
}

export function listAtoRatesForCurrency(currencyCode: string): AtoExchangeRate[] {
  return ATO_RATES.filter((r) => r.currencyCode === currencyCode.toUpperCase())
}

export const ATO_FX_ENGINE_NOTE = ENGINE_VERSION
