import { useCallback, useEffect, useMemo, useState } from 'react'
import { useFy } from '@/app/providers/fy-provider'
import {
  buildDashboardSnapshot,
  monthlyIncomeFromPlanner,
} from '@/features/dashboard/utils/build-snapshot'
import { listSampleDaysForFy } from '@/features/destination-workspace/services/sample-day-store'
import { listEvidenceRecords } from '@/features/evidence/services/evidence-vault'
import {
  countActiveUnlinkedClaims,
  listClaimsWithEvidenceStatus,
} from '@/features/evidence/utils/claim-evidence-status'
import { getSummary, loadPlanner } from '@/shared/lib/local-data-store'

export function useDashboardSnapshot() {
  const { fyEndYear, label } = useFy()
  const [tick, setTick] = useState(0)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => setTick((t) => t + 1), [])

  useEffect(() => {
    setLoading(true)
    const id = window.setTimeout(() => setLoading(false), 160)
    return () => window.clearTimeout(id)
  }, [fyEndYear, tick])

  useEffect(() => {
    const onFocus = () => refresh()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [refresh])

  const snapshot = useMemo(() => {
    void tick
    const summary = getSummary(fyEndYear)
    const evidence = listEvidenceRecords(fyEndYear)
    const sampleDays = listSampleDaysForFy(fyEndYear)
    const planner = loadPlanner(fyEndYear)
    const year = planner.years.find((y) => y.fyEndYear === fyEndYear)
    const qualifyingOvernights = (year?.monthAway ?? []).reduce((sum, m) => sum + m.nights, 0)
    const claimCount = listClaimsWithEvidenceStatus(fyEndYear).length
    const unlinkedClaimCount = countActiveUnlinkedClaims(fyEndYear)
    const hasIncome = (summary?.totalIncomeAud ?? 0) > 0
    const hasExpenses = (summary?.totalClaimsAud ?? 0) > 0

    return buildDashboardSnapshot({
      fyEndYear,
      fyLabel: label,
      summary,
      evidence,
      sampleDays,
      destinations: planner.destinations.map((d) => ({ id: d.id, name: d.name })),
      claimCount,
      unlinkedClaimCount,
      qualifyingOvernights,
      hasIncome,
      hasExpenses,
      monthlyIncomeAud: monthlyIncomeFromPlanner(year?.monthlyIncome ?? []),
    })
  }, [fyEndYear, label, tick])

  return { snapshot, loading, refresh }
}
