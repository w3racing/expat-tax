import { useCallback, useEffect, useState } from 'react'
import { useFy } from '@/app/providers/fy-provider'
import {
  emptyTaxYear,
  type TaxPlannerState,
  type TaxYearRecord,
} from '@/features/tax-position/engine'
import {
  getPersistedSummary,
  loadTaxPlanner,
  saveTaxPlanner,
  type PersistedTaxSummary,
  type SummarySource,
} from '@/features/tax-position/services/position-service'
import type { DraftSaveState } from '@/shared/components/ui/draft-status'

export function useTaxPosition() {
  const { fyEndYear, label, setFyEndYear } = useFy()
  const [planner, setPlanner] = useState<TaxPlannerState>(() => loadTaxPlanner(fyEndYear))
  const [year, setYear] = useState<TaxYearRecord>(() => {
    const p = loadTaxPlanner(fyEndYear)
    return p.years.find((y) => y.fyEndYear === fyEndYear) ?? emptyTaxYear(fyEndYear)
  })
  const [persisted, setPersisted] = useState<PersistedTaxSummary | null>(() =>
    getPersistedSummary(fyEndYear),
  )
  const [draftState, setDraftState] = useState<DraftSaveState>('idle')

  useEffect(() => {
    const p = loadTaxPlanner(fyEndYear)
    setPlanner(p)
    setYear(p.years.find((y) => y.fyEndYear === fyEndYear) ?? emptyTaxYear(fyEndYear))
    setPersisted(getPersistedSummary(fyEndYear))
  }, [fyEndYear])

  const persistYear = useCallback(
    (next: TaxYearRecord, source: SummarySource = 'user_edit') => {
      setYear(next)
      setDraftState('saving')
      try {
        const nextPlanner = loadTaxPlanner(fyEndYear)
        const idx = nextPlanner.years.findIndex((y) => y.fyEndYear === fyEndYear)
        if (idx >= 0) nextPlanner.years[idx] = next
        else nextPlanner.years.push(next)
        nextPlanner.activeFyEndYear = fyEndYear
        setPlanner(nextPlanner)
        const record = saveTaxPlanner(nextPlanner, source)
        setPersisted(record)
        window.setTimeout(() => setDraftState('saved'), 200)
      } catch {
        setDraftState('error')
      }
    },
    [fyEndYear],
  )

  const persistPlanner = useCallback(
    (next: TaxPlannerState, source: SummarySource = 'user_edit') => {
      setDraftState('saving')
      try {
        next.activeFyEndYear = fyEndYear
        setPlanner(next)
        const y = next.years.find((row) => row.fyEndYear === fyEndYear) ?? emptyTaxYear(fyEndYear)
        setYear(y)
        const record = saveTaxPlanner(next, source)
        setPersisted(record)
        window.setTimeout(() => setDraftState('saved'), 200)
      } catch {
        setDraftState('error')
      }
    },
    [fyEndYear],
  )

  return {
    fyEndYear,
    label,
    setFyEndYear,
    planner,
    year,
    persisted,
    draftState,
    persistYear,
    persistPlanner,
  }
}
