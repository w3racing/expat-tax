import { listEvidenceRecords } from '@/features/evidence/services/evidence-vault'
import {
  averageDailySpendAud,
  type SampleDay,
} from '@/features/destination-workspace/types/sample-day'
import {
  destinationClaimAud,
  destinationNightsTotal,
} from '@/features/overnight-planner/utils/overnight-matrix'
import type { MonthAway } from '@/features/tax-position/engine/types'

export type DestinationWorkspaceStats = {
  destinationId: string
  destinationName: string
  fyEndYear: number
  qualifyingOvernights: number
  /** Rate currently in the overnight engine (updated from sample-day average when available). */
  dailyRateAud: number
  /** nights × daily rate — same engine path as Tax Position */
  currentClaimAud: number
  averageDailySpendAud: number | null
  sampleDaysCompleted: number
  sampleDaysInProgress: number
  evidenceLinked: number
  /** True when claim rate comes from completed sample days */
  rateFromSampleDays: boolean
}

export function buildDestinationStats(input: {
  destinationId: string
  destinationName: string
  fyEndYear: number
  monthAway: MonthAway[]
  dailyRateAud: number
  sampleDays: SampleDay[]
}): DestinationWorkspaceStats {
  const qualifyingOvernights = destinationNightsTotal(input.monthAway, input.destinationId)
  const average = averageDailySpendAud(input.sampleDays)
  const effectiveRate = average ?? input.dailyRateAud
  const currentClaimAud = destinationClaimAud(
    input.monthAway,
    input.destinationId,
    effectiveRate,
  )
  const evidenceLinked = listEvidenceRecords(input.fyEndYear).filter(
    (e) => e.destinationId === input.destinationId,
  ).length

  return {
    destinationId: input.destinationId,
    destinationName: input.destinationName,
    fyEndYear: input.fyEndYear,
    qualifyingOvernights,
    dailyRateAud: effectiveRate,
    currentClaimAud,
    averageDailySpendAud: average,
    sampleDaysCompleted: input.sampleDays.filter((d) => d.status === 'complete').length,
    sampleDaysInProgress: input.sampleDays.filter((d) => d.status === 'in_progress').length,
    evidenceLinked,
    rateFromSampleDays: average != null,
  }
}
