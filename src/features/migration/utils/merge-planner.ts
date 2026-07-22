import type { TaxPlannerState, TaxYearRecord } from '@/features/tax-position/engine'

type HasId = { id: string }

/** Merge arrays by id: existing-only kept, incoming updates matches, new rows added. */
export function mergeById<T extends HasId>(existing: T[], incoming: T[]): T[] {
  const map = new Map<string, T>()
  for (const row of existing) map.set(row.id, row)
  for (const row of incoming) map.set(row.id, row)
  return [...map.values()]
}

function mergeDestinationRates(
  existing: TaxPlannerState['ratesByFy'],
  incoming: TaxPlannerState['ratesByFy'],
): TaxPlannerState['ratesByFy'] {
  const keys = new Set([...Object.keys(existing), ...Object.keys(incoming)])
  const out: TaxPlannerState['ratesByFy'] = {}
  for (const key of keys) {
    const a = existing[key] ?? []
    const b = incoming[key] ?? []
    const map = new Map(a.map((r) => [r.destinationId, r]))
    for (const r of b) map.set(r.destinationId, r)
    out[key] = [...map.values()]
  }
  return out
}

function mergeYearNotes(existing: string, incoming: string): string {
  const a = existing.trim()
  const b = incoming.trim()
  if (!a) return incoming
  if (!b) return existing
  if (a === b) return existing
  return `${a}\n\n— Imported notes —\n${b}`
}

function mergeYear(existing: TaxYearRecord, incoming: TaxYearRecord): TaxYearRecord {
  return {
    fyEndYear: existing.fyEndYear,
    // Settings from backup win for the imported FY (authoritative V1 stance)
    superannuationAud: incoming.superannuationAud,
    overseasDailyOverrideAud: incoming.overseasDailyOverrideAud,
    includeMedicareLevy: incoming.includeMedicareLevy,
    notes: mergeYearNotes(existing.notes, incoming.notes),
    monthlyIncome: mergeById(existing.monthlyIncome, incoming.monthlyIncome),
    monthAway: mergeById(existing.monthAway, incoming.monthAway),
    otherClaims: mergeById(existing.otherClaims, incoming.otherClaims),
    flights: mergeById(existing.flights, incoming.flights),
    transport: mergeById(existing.transport, incoming.transport),
    carKm: mergeById(existing.carKm, incoming.carKm),
    laundry: mergeById(existing.laundry, incoming.laundry),
    apartmentCosts: mergeById(existing.apartmentCosts, incoming.apartmentCosts),
    interestByAccount: mergeById(existing.interestByAccount, incoming.interestByAccount),
    dividends: mergeById(existing.dividends, incoming.dividends),
    rentalProperties: mergeById(existing.rentalProperties, incoming.rentalProperties),
    capitalGains: mergeById(existing.capitalGains, incoming.capitalGains),
    otherInvestments: mergeById(existing.otherInvestments, incoming.otherInvestments),
  }
}

/**
 * Merge an imported TaxPlannerState into existing position data.
 * Never drops existing entities that are absent from the backup.
 */
export function mergePlannerStates(
  existing: TaxPlannerState | null,
  incoming: TaxPlannerState,
): TaxPlannerState {
  if (!existing) return structuredClone(incoming)

  const destMap = new Map(existing.destinations.map((d) => [d.id, d]))
  for (const d of incoming.destinations) destMap.set(d.id, d)

  const bankMap = new Map(existing.bankAccounts.map((b) => [b.id, b]))
  for (const b of incoming.bankAccounts) bankMap.set(b.id, b)

  const years = [...existing.years]
  for (const year of incoming.years) {
    const idx = years.findIndex((y) => y.fyEndYear === year.fyEndYear)
    if (idx >= 0) years[idx] = mergeYear(years[idx]!, year)
    else years.push(year)
  }

  return {
    schemaVersion: 2,
    destinations: [...destMap.values()].sort((a, b) => a.sortOrder - b.sortOrder),
    bankAccounts: [...bankMap.values()].sort((a, b) => a.sortOrder - b.sortOrder),
    ratesByFy: mergeDestinationRates(existing.ratesByFy, incoming.ratesByFy),
    years: years.sort((a, b) => a.fyEndYear - b.fyEndYear),
    activeFyEndYear: incoming.activeFyEndYear,
    overseasAtoSalaryTable: incoming.overseasAtoSalaryTable,
  }
}
