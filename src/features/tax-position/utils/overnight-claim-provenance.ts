import {
  averageDailySpendAud,
  sampleDayTotalAud,
  type SampleDay,
} from '@/features/destination-workspace/types/sample-day'
import {
  destinationClaimAud,
  destinationNightsTotal,
  rateMapForFy,
  sortedDestinations,
} from '@/features/overnight-planner/utils/overnight-matrix'
import type { TaxPlannerState } from '@/features/tax-position/engine/types'

export type DestinationOvernightProvenance = {
  destinationId: string
  destinationName: string
  qualifyingOvernights: number
  dailyRateAud: number
  rateSource: 'sample_day_average' | 'planner_daily_rate'
  sampleDaysCompleted: number
  sampleDaysInProgress: number
  averageDailySpendAud: number | null
  claimAud: number
  completedDayLabels: string[]
}

export type OvernightClaimProvenance = {
  fyEndYear: number
  totalOvernights: number
  totalClaimAud: number
  calculatedClaimAud: number
  overrideAud: number | null
  destinations: DestinationOvernightProvenance[]
  sampleDayCount: number
  completedSampleDayCount: number
  formula: string
  source: string
}

/**
 * Traceable overnight claim for Tax Position + accountant export (U11–U12).
 * Maths unchanged: Σ (nights × dailyRate) with optional year override.
 */
export function buildOvernightClaimProvenance(input: {
  fyEndYear: number
  planner: TaxPlannerState
  sampleDays: SampleDay[]
}): OvernightClaimProvenance {
  const year = input.planner.years.find((y) => y.fyEndYear === input.fyEndYear)
  const rates = input.planner.ratesByFy[String(input.fyEndYear)] ?? []
  const rateMap = rateMapForFy(rates)
  const destinations = sortedDestinations(input.planner.destinations)

  const sampleDays = input.sampleDays ?? []
  const rows: DestinationOvernightProvenance[] = destinations.map((dest) => {
    const days = sampleDays.filter((d) => d.destinationId === dest.id)
    const average = averageDailySpendAud(days)
    const plannerRate = rateMap.get(dest.id) ?? 0
    const applied = average ?? plannerRate
    const nights = year ? destinationNightsTotal(year.monthAway, dest.id) : 0
    const completed = days.filter((d) => d.status === 'complete')
    const rateSource: DestinationOvernightProvenance['rateSource'] =
      average != null ? 'sample_day_average' : 'planner_daily_rate'

    return {
      destinationId: dest.id,
      destinationName: dest.name,
      qualifyingOvernights: nights,
      dailyRateAud: applied,
      rateSource,
      sampleDaysCompleted: completed.length,
      sampleDaysInProgress: days.filter((d) => d.status === 'in_progress').length,
      averageDailySpendAud: average,
      claimAud: year ? destinationClaimAud(year.monthAway, dest.id, applied) : 0,
      completedDayLabels: completed.map(
        (d) => `${d.label} (${formatPlain(sampleDayTotalAud(d))})`,
      ),
    }
  }).filter((r) => r.qualifyingOvernights > 0 || r.sampleDaysCompleted > 0 || r.sampleDaysInProgress > 0)

  const calculatedClaimAud = rows.reduce((sum, r) => sum + r.claimAud, 0)
  const overrideAud = year?.overseasDailyOverrideAud ?? null
  const totalClaimAud = overrideAud != null ? overrideAud : calculatedClaimAud
  const totalOvernights = year
    ? year.monthAway.reduce((sum, m) => sum + m.nights, 0)
    : 0
  const completedSampleDayCount = sampleDays.filter((d) => d.status === 'complete').length

  return {
    fyEndYear: input.fyEndYear,
    totalOvernights,
    totalClaimAud,
    calculatedClaimAud,
    overrideAud,
    destinations: rows,
    sampleDayCount: sampleDays.length,
    completedSampleDayCount,
    formula:
      overrideAud != null
        ? `Year override ${formatPlain(overrideAud)} (calculated ${formatPlain(calculatedClaimAud)} from nights × rate)`
        : 'Σ (qualifying overnights × daily amount) per destination',
    source:
      completedSampleDayCount > 0
        ? 'Overnight planner nights × sample-day average (or planner daily rate where no completed sample days)'
        : 'Overnight planner nights × planner daily rate per destination',
  }
}

function formatPlain(n: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}
