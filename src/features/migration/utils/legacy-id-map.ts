import type { TaxPlannerState } from '@/features/tax-position/engine'
import type { EntityType, LegacyIdMapEntry } from '@/features/migration/types/import'

/** Build legacy_id_map entries — original ids preserved as both legacy and new in local MVP. */
export function buildPlannerLegacyIdMap(state: TaxPlannerState): LegacyIdMapEntry[] {
  const entries: LegacyIdMapEntry[] = []

  const push = (entityType: EntityType, id: string) => {
    entries.push({ entityType, legacyId: id, newId: id })
  }

  for (const d of state.destinations) push('destination', d.id)
  for (const b of state.bankAccounts) push('bank_account', b.id)

  for (const year of state.years) {
    push('financial_year', `fy:${year.fyEndYear}`)
    for (const row of year.monthlyIncome) push('employment_income_month', row.id)
    for (const row of year.monthAway) push('destination_nights_month', row.id)
    for (const row of year.otherClaims) push('work_expense_claim', row.id)
    for (const row of year.flights) push('flight_claim', row.id)
    for (const row of year.transport) push('transport_claim', row.id)
    for (const row of year.carKm) push('car_km_claim', row.id)
    for (const row of year.laundry) push('laundry_claim', row.id)
    for (const row of year.apartmentCosts) push('apartment_expense_claim', row.id)
    for (const row of year.interestByAccount) push('interest_entry', row.id)
    for (const row of year.dividends) push('dividend_entry', row.id)
    for (const row of year.rentalProperties) push('rental_property_entry', row.id)
    for (const row of year.capitalGains) push('capital_gain_entry', row.id)
    for (const row of year.otherInvestments) push('other_investment_entry', row.id)
  }

  for (const [fy, rates] of Object.entries(state.ratesByFy)) {
    for (const rate of rates) {
      push('destination_rate', `destination_rate:${fy}:${rate.destinationId}`)
    }
  }

  return entries
}

export function countPlannerEntities(state: TaxPlannerState) {
  let claims = 0
  let incomeMonths = 0
  for (const y of state.years) {
    incomeMonths += y.monthlyIncome.length
    claims +=
      y.otherClaims.length +
      y.flights.length +
      y.transport.length +
      y.carKm.length +
      y.laundry.length +
      y.apartmentCosts.length +
      y.interestByAccount.length +
      y.dividends.length +
      y.rentalProperties.length +
      y.capitalGains.length +
      y.otherInvestments.length
  }
  return {
    years: state.years.length,
    destinations: state.destinations.length,
    bankAccounts: state.bankAccounts.length,
    claims,
    incomeMonths,
  }
}
