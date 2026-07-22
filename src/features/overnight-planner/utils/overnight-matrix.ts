import type {
  DestinationRate,
  MonthAway,
  TaxDestination,
} from '@/features/tax-position/engine/types'

export function rateMapForFy(
  rates: DestinationRate[] | undefined,
): Map<string, number> {
  return new Map((rates ?? []).map((r) => [r.destinationId, r.dailyRateAud]))
}

export function nightsAt(
  monthAway: MonthAway[],
  monthKey: string,
  destinationId: string,
): number {
  const row = monthAway.find(
    (m) => m.monthKey === monthKey && m.destinationId === destinationId,
  )
  return row?.nights ?? 0
}

/** Upsert nights; remove row when nights is 0. */
export function setNightsAt(
  monthAway: MonthAway[],
  monthKey: string,
  destinationId: string,
  nights: number,
): MonthAway[] {
  const idx = monthAway.findIndex(
    (m) => m.monthKey === monthKey && m.destinationId === destinationId,
  )

  if (nights <= 0) {
    if (idx < 0) return monthAway
    return monthAway.filter((_, i) => i !== idx)
  }

  if (idx >= 0) {
    const next = [...monthAway]
    next[idx] = { ...next[idx]!, nights }
    return next
  }

  return [
    ...monthAway,
    {
      id: crypto.randomUUID(),
      monthKey,
      destinationId,
      nights,
    },
  ]
}

export function monthNightsTotal(
  monthAway: MonthAway[],
  monthKey: string,
  destinationIds: string[],
): number {
  return destinationIds.reduce(
    (sum, id) => sum + nightsAt(monthAway, monthKey, id),
    0,
  )
}

export function monthClaimAud(
  monthAway: MonthAway[],
  monthKey: string,
  rates: Map<string, number>,
  destinationIds: string[],
): number {
  return destinationIds.reduce((sum, id) => {
    const nights = nightsAt(monthAway, monthKey, id)
    const rate = rates.get(id) ?? 0
    return sum + nights * rate
  }, 0)
}

export function yearNightsTotal(
  monthAway: MonthAway[],
  destinationIds?: string[],
): number {
  if (!destinationIds) {
    return monthAway.reduce((sum, m) => sum + m.nights, 0)
  }
  const allow = new Set(destinationIds)
  return monthAway.reduce(
    (sum, m) => (allow.has(m.destinationId) ? sum + m.nights : sum),
    0,
  )
}

export function yearClaimAud(
  monthAway: MonthAway[],
  rates: Map<string, number>,
  destinationIds: string[],
): number {
  return monthAway.reduce((sum, m) => {
    if (!destinationIds.includes(m.destinationId)) return sum
    return sum + m.nights * (rates.get(m.destinationId) ?? 0)
  }, 0)
}

export function destinationNightsTotal(
  monthAway: MonthAway[],
  destinationId: string,
): number {
  return monthAway.reduce(
    (sum, m) => (m.destinationId === destinationId ? sum + m.nights : sum),
    0,
  )
}

export function destinationClaimAud(
  monthAway: MonthAway[],
  destinationId: string,
  rate: number,
): number {
  return destinationNightsTotal(monthAway, destinationId) * rate
}

export function sortedDestinations(destinations: TaxDestination[]): TaxDestination[] {
  return [...destinations].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
}

export function upsertDestinationRate(
  rates: DestinationRate[],
  destinationId: string,
  dailyRateAud: number,
): DestinationRate[] {
  const idx = rates.findIndex((r) => r.destinationId === destinationId)
  if (idx >= 0) {
    const next = [...rates]
    next[idx] = { destinationId, dailyRateAud }
    return next
  }
  return [...rates, { destinationId, dailyRateAud }]
}

export function removeDestinationFromPlanner(
  destinations: TaxDestination[],
  rates: DestinationRate[],
  monthAway: MonthAway[],
  destinationId: string,
): {
  destinations: TaxDestination[]
  rates: DestinationRate[]
  monthAway: MonthAway[]
} {
  return {
    destinations: destinations.filter((d) => d.id !== destinationId),
    rates: rates.filter((r) => r.destinationId !== destinationId),
    monthAway: monthAway.filter((m) => m.destinationId !== destinationId),
  }
}
