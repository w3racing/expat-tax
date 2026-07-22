import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTaxPosition } from '@/features/tax-position'
import { buildDestinationStats } from '@/features/destination-workspace/utils/destination-stats'
import { calculateDestinationAverage } from '@/features/destination-workspace/utils/destination-average-calc'
import {
  completeSampleDay,
  createSampleDay,
  deleteSampleDay,
  listSampleDays,
  reopenSampleDay,
  syncAverageAndPersist,
} from '@/features/destination-workspace/services/sample-day-store'
import {
  rateMapForFy,
  sortedDestinations,
} from '@/features/overnight-planner/utils/overnight-matrix'
import { loadTaxPlanner } from '@/features/tax-position/services/position-service'

export function useDestinationWorkspace(destinationId: string | undefined) {
  const navigate = useNavigate()
  const { fyEndYear, label, planner, year, persistPlanner } = useTaxPosition()
  const [tick, setTick] = useState(0)
  const refresh = useCallback(() => setTick((t) => t + 1), [])

  const destination = useMemo(
    () => planner.destinations.find((d) => d.id === destinationId) ?? null,
    [planner.destinations, destinationId],
  )

  const destinations = useMemo(
    () => sortedDestinations(planner.destinations),
    [planner.destinations],
  )
  const rates = planner.ratesByFy[String(fyEndYear)] ?? []
  const plannerDailyRateAud = useMemo(() => {
    if (!destinationId) return 0
    return rateMapForFy(rates).get(destinationId) ?? 0
  }, [rates, destinationId])

  const sampleDays = useMemo(() => {
    void tick
    if (!destinationId) return []
    return listSampleDays(fyEndYear, destinationId)
  }, [destinationId, fyEndYear, tick])

  const calculation = useMemo(() => {
    if (!destination || !destinationId) return null
    return calculateDestinationAverage({
      destinationId,
      destinationName: destination.name,
      fyEndYear,
      monthAway: year.monthAway,
      rates,
      destinationIds: destinations.map((d) => d.id),
      plannerDailyRateAud,
      sampleDays,
    })
  }, [
    destination,
    destinationId,
    fyEndYear,
    year.monthAway,
    rates,
    destinations,
    plannerDailyRateAud,
    sampleDays,
  ])

  const stats = useMemo(() => {
    if (!destination || !destinationId || !calculation) return null
    const base = buildDestinationStats({
      destinationId,
      destinationName: destination.name,
      fyEndYear,
      monthAway: year.monthAway,
      dailyRateAud: plannerDailyRateAud,
      sampleDays,
    })
    return {
      ...base,
      dailyRateAud: calculation.appliedDailyRateAud,
      currentClaimAud: calculation.destinationClaimAud,
      averageDailySpendAud: calculation.averageDailySpendAud,
      rateFromSampleDays: calculation.rateSource === 'sample_day_average',
      financialYearClaimAud: calculation.financialYearClaimAud,
      totalSampleDaysAud: calculation.totalSampleDaysAud,
      averageAudValue: calculation.averageAudValue,
    }
  }, [
    destination,
    destinationId,
    calculation,
    fyEndYear,
    year.monthAway,
    plannerDailyRateAud,
    sampleDays,
  ])

  const syncTaxPosition = useCallback(() => {
    if (!destinationId) return
    const current = loadTaxPlanner(fyEndYear)
    const next = syncAverageAndPersist(current, fyEndYear, destinationId)
    persistPlanner(next)
    refresh()
  }, [destinationId, fyEndYear, persistPlanner, refresh])

  const createAndOpenSampleDay = useCallback(
    (fromClaim = false) => {
      if (!destinationId) return null
      const day = createSampleDay({ destinationId, fyEndYear })
      refresh()
      const path = `/overnight/${destinationId}/sample-days/${day.id}`
      navigate(fromClaim ? `${path}?from=claim` : path)
      return day
    },
    [destinationId, fyEndYear, navigate, refresh],
  )

  const complete = useCallback(
    (id: string) => {
      completeSampleDay(id)
      syncTaxPosition()
    },
    [syncTaxPosition],
  )

  const reopen = useCallback(
    (id: string) => {
      reopenSampleDay(id)
      syncTaxPosition()
    },
    [syncTaxPosition],
  )

  const remove = useCallback(
    (id: string) => {
      deleteSampleDay(id)
      syncTaxPosition()
    },
    [syncTaxPosition],
  )

  return {
    fyEndYear,
    fyLabel: label,
    destination,
    stats,
    calculation,
    sampleDays,
    dailyRateAud: plannerDailyRateAud,
    year,
    refresh,
    syncTaxPosition,
    createAndOpenSampleDay,
    complete,
    reopen,
    remove,
  }
}
