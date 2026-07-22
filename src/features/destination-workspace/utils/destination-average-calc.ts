import {
  averageDailySpendAud,
  sampleDayTotalAud,
  type SampleDay,
} from '@/features/destination-workspace/types/sample-day'
import {
  destinationClaimAud,
  destinationNightsTotal,
  rateMapForFy,
  yearClaimAud,
} from '@/features/overnight-planner/utils/overnight-matrix'
import type { DestinationRate, MonthAway } from '@/features/tax-position/engine/types'
import { ENGINE_VERSION } from '@/features/tax-position/engine/constants'

/**
 * AJX Calculator–compatible destination average maths.
 *
 * averageDailySpendAud = Σ (completed sample day AUD totals) ÷ count(completed days)
 * destinationClaimAud  = qualifyingOvernights × averageDailySpendAud
 *                        (or × planner daily rate when no completed sample days)
 * financialYearClaim   = Σ (nights × rate) across all destinations
 *                        (same as summarizeTaxYear overseasDailyCalculatedAud)
 */

export type SampleDayContribution = {
  id: string
  label: string
  status: 'complete' | 'in_progress'
  receiptCount: number
  totalAud: number
  /** Included in the average only when complete */
  includedInAverage: boolean
}

export type CalculationStep = {
  id: string
  label: string
  /** Where the inputs come from */
  source: string
  /** Human-readable formula */
  calculation: string
  resultAud: number | null
  resultLabel?: string
}

export type DestinationAverageCalculation = {
  destinationId: string
  destinationName: string
  fyEndYear: number
  engineVersion: string

  /** Completed sample days that feed the average */
  sampleDayContributions: SampleDayContribution[]
  sampleDaysCompleted: number
  sampleDaysInProgress: number

  /** Σ completed day AUD totals */
  totalSampleDaysAud: number
  /** Average daily spend / average AUD value (identical in Calculator terms) */
  averageDailySpendAud: number | null
  averageAudValue: number | null

  qualifyingOvernights: number
  /** Rate applied to nights: sample average when present, else planner rate */
  appliedDailyRateAud: number
  rateSource: 'sample_day_average' | 'planner_daily_rate'

  destinationClaimAud: number
  financialYearClaimAud: number

  /** Traceable steps for UI: Sample Days → Average → Calculation → Final Claim */
  steps: CalculationStep[]
}

export function calculateDestinationAverage(input: {
  destinationId: string
  destinationName: string
  fyEndYear: number
  monthAway: MonthAway[]
  /** All destinations' rates for FY claim (Calculator Σ nights × rate) */
  rates: DestinationRate[]
  /** All destination ids used for FY total */
  destinationIds: string[]
  /** Planner daily rate for this destination (fallback) */
  plannerDailyRateAud: number
  sampleDays: SampleDay[]
}): DestinationAverageCalculation {
  const contributions: SampleDayContribution[] = input.sampleDays.map((d) => ({
    id: d.id,
    label: d.label,
    status: d.status,
    receiptCount: d.receipts.length,
    totalAud: sampleDayTotalAud(d),
    includedInAverage: d.status === 'complete',
  }))

  const completed = contributions.filter((c) => c.includedInAverage)
  const sampleDaysCompleted = completed.length
  const sampleDaysInProgress = contributions.filter((c) => c.status === 'in_progress').length
  const totalSampleDaysAud = completed.reduce((sum, c) => sum + c.totalAud, 0)
  const average = averageDailySpendAud(input.sampleDays)

  const qualifyingOvernights = destinationNightsTotal(
    input.monthAway,
    input.destinationId,
  )

  const rateFromSamples = average != null
  const appliedDailyRateAud = rateFromSamples ? average : input.plannerDailyRateAud
  const destinationClaim = destinationClaimAud(
    input.monthAway,
    input.destinationId,
    appliedDailyRateAud,
  )

  // FY claim uses current rates map (after sync, average is written into ratesByFy)
  const rateMap = rateMapForFy(input.rates)
  // Ensure this destination's applied rate is reflected for FY total consistency
  rateMap.set(input.destinationId, appliedDailyRateAud)
  const financialYearClaimAud = yearClaimAud(
    input.monthAway,
    rateMap,
    input.destinationIds,
  )

  const dayListFormula =
    sampleDaysCompleted === 0
      ? 'No completed sample days yet'
      : completed.map((c) => `${c.label} (${formatPlain(c.totalAud)})`).join(' + ')

  const steps: CalculationStep[] = [
    {
      id: 'sample-days',
      label: 'Sample Days',
      source: `${sampleDaysCompleted} completed · ${sampleDaysInProgress} in progress`,
      calculation:
        sampleDaysCompleted === 0
          ? 'Only completed sample days count. Days still in progress are ignored.'
          : `Sum of completed day totals: ${dayListFormula}`,
      resultAud: sampleDaysCompleted === 0 ? null : totalSampleDaysAud,
      resultLabel: sampleDaysCompleted === 0 ? undefined : 'Total AUD from completed days',
    },
    {
      id: 'average',
      label: 'Average',
      source: 'Completed sample days only (AJX Calculator average daily spend)',
      calculation:
        average == null
          ? 'Average = (sum of completed day AUD totals) ÷ (number of completed days)'
          : `Average daily spend = ${formatPlain(totalSampleDaysAud)} ÷ ${sampleDaysCompleted} = ${formatPlain(average)}`,
      resultAud: average,
      resultLabel: 'Average AUD value / average daily spend',
    },
    {
      id: 'calculation',
      label: 'Calculation',
      source: 'Overnight planner (qualifying overnights) × average (or planner daily rate)',
      calculation: rateFromSamples
        ? `${qualifyingOvernights} overnights × ${formatPlain(appliedDailyRateAud)} average = ${formatPlain(destinationClaim)}`
        : `${qualifyingOvernights} overnights × ${formatPlain(appliedDailyRateAud)} planner daily rate = ${formatPlain(destinationClaim)}`,
      resultAud: destinationClaim,
      resultLabel: 'Destination claim (before FY roll-up)',
    },
    {
      id: 'final-claim',
      label: 'Final Claim',
      source: 'Same path as Tax Position overseas daily (Σ nights × rate per destination)',
      calculation: `Destination claim ${formatPlain(destinationClaim)} · Financial year overnight claim ${formatPlain(financialYearClaimAud)}`,
      resultAud: destinationClaim,
      resultLabel: 'Shown on Tax Position for this destination',
    },
  ]

  return {
    destinationId: input.destinationId,
    destinationName: input.destinationName,
    fyEndYear: input.fyEndYear,
    engineVersion: ENGINE_VERSION,
    sampleDayContributions: contributions,
    sampleDaysCompleted,
    sampleDaysInProgress,
    totalSampleDaysAud,
    averageDailySpendAud: average,
    averageAudValue: average,
    qualifyingOvernights,
    appliedDailyRateAud,
    rateSource: rateFromSamples ? 'sample_day_average' : 'planner_daily_rate',
    destinationClaimAud: destinationClaim,
    financialYearClaimAud,
    steps,
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
