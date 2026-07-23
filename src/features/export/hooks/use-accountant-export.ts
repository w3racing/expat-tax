import { useCallback, useMemo, useState } from 'react'
import { useAuth } from '@/app/providers/auth-provider'
import { useFy } from '@/app/providers/fy-provider'
import { listSampleDaysForFy } from '@/features/destination-workspace/services/sample-day-store'
import { listEvidenceRecords } from '@/features/evidence/services/evidence-vault'
import { generateAccountantExport } from '@/features/export/services/generate-accountant-package'
import { buildAccountantPackageData } from '@/features/export/utils/build-package-data'
import {
  deleteExportJob,
  getSummary,
  listExportJobs,
  loadPlanner,
  type ExportJobRecord,
} from '@/shared/lib/local-data-store'

export function useAccountantExport() {
  const { fyEndYear, label } = useFy()
  const { user } = useAuth()
  const [phase, setPhase] = useState<{ label: string; progress: number } | null>(null)
  const [error, setError] = useState(false)
  const [lastPdfName, setLastPdfName] = useState<string | null>(null)
  const [jobs, setJobs] = useState<ExportJobRecord[]>(() => listExportJobs())
  const [tick, setTick] = useState(0)

  const summary = useMemo(() => {
    void tick
    return getSummary(fyEndYear)
  }, [fyEndYear, tick])

  const evidence = useMemo(() => {
    void tick
    return listEvidenceRecords(fyEndYear)
  }, [fyEndYear, tick])

  const sampleDays = useMemo(() => {
    void tick
    return listSampleDaysForFy(fyEndYear)
  }, [fyEndYear, tick])

  const preview = useMemo(() => {
    if (!summary) return null
    const planner = loadPlanner(fyEndYear)
    return buildAccountantPackageData({
      taxpayer: {
        displayName: user?.displayName ?? 'Taxpayer',
        email: user?.email ?? '',
        userId: user?.id ?? 'local',
      },
      fyEndYear,
      fyLabel: label,
      planner,
      summary,
      evidence,
      sampleDays,
    })
  }, [evidence, fyEndYear, label, sampleDays, summary, user])

  const refresh = useCallback(() => setTick((t) => t + 1), [])

  const generate = useCallback(async () => {
    setError(false)
    setLastPdfName(null)
    try {
      const result = await generateAccountantExport({
        fyEndYear,
        fyLabel: label,
        user,
        onPhase: setPhase,
      })
      setLastPdfName(result.pdfFileName)
      setJobs(listExportJobs())
      setPhase(null)
      refresh()
    } catch {
      setJobs(listExportJobs())
      setPhase(null)
      setError(true)
    }
  }, [fyEndYear, label, refresh, user])

  const removeJob = useCallback((id: string) => {
    deleteExportJob(id)
    setJobs(listExportJobs())
  }, [])

  return {
    fyEndYear,
    label,
    summary,
    evidence,
    preview,
    phase,
    error,
    lastPdfName,
    jobs,
    canExport: Boolean(summary),
    generate,
    removeJob,
    refresh,
  }
}
