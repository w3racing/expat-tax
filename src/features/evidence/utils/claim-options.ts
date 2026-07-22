import { loadTaxPlanner } from '@/features/tax-position/services/position-service'
import type { EvidenceClaimOption } from '@/features/evidence/types/evidence'

/** Claim options from Tax Position for linking evidence. */
export function listClaimOptions(fyEndYear: number): EvidenceClaimOption[] {
  const planner = loadTaxPlanner(fyEndYear)
  const year = planner.years.find((y) => y.fyEndYear === fyEndYear)
  if (!year) return []

  const options: EvidenceClaimOption[] = []

  for (const c of year.otherClaims) {
    options.push({
      id: c.id,
      label: [c.dateYmd, c.description?.trim() || `Work claim (${c.currencyCode})`]
        .filter(Boolean)
        .join(' · '),
    })
  }
  for (const c of year.flights) {
    options.push({
      id: c.id,
      label: [c.dateYmd, c.description?.trim() || `Flight (${c.currencyCode})`]
        .filter(Boolean)
        .join(' · '),
    })
  }
  for (const c of year.transport) {
    options.push({
      id: c.id,
      label: [c.dateYmd, c.description?.trim() || `Transport (${c.currencyCode})`]
        .filter(Boolean)
        .join(' · '),
    })
  }
  for (const c of year.carKm) {
    options.push({
      id: c.id,
      label: c.description?.trim() || `Car km (${c.kilometres} km)`,
    })
  }
  for (const c of year.laundry) {
    options.push({ id: c.id, label: `Laundry` })
  }
  for (const c of year.apartmentCosts) {
    options.push({ id: c.id, label: `Apartment · ${c.kind}` })
  }
  for (const m of year.monthlyIncome) {
    options.push({ id: m.id, label: `Employment · ${m.monthKey}` })
  }

  return options
}
