import { useCallback, useMemo, useState } from 'react'
import { useAuth } from '@/app/providers/auth-provider'
import { useFy } from '@/app/providers/fy-provider'
import { listSampleDaysForFy } from '@/features/destination-workspace/services/sample-day-store'
import { listEvidenceRecords } from '@/features/evidence/services/evidence-vault'
import { generateAuditPackage } from '@/features/audit/services/generate-audit-package'
import { buildAuditPackageData } from '@/features/audit/utils/build-audit-package-data'
import { buildAuditReadiness } from '@/features/audit/utils/build-audit-readiness'
import {
  deleteExportJob,
  getSummary,
  listExportJobs,
  loadPlanner,
  type ExportJobRecord,
} from '@/shared/lib/local-data-store'

export function useAuditPackage() {
  const { fyEndYear, label } = useFy()
  const { user } = useAuth()
  const [phase, setPhase] = useState<{ label: string; progress: number } | null>(null)
  const [error, setError] = useState(false)
  const [lastZipName, setLastZipName] = useState<string | null>(null)
  const [includeReceiptThumbnails, setIncludeReceiptThumbnails] = useState(true)
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

  const planner = useMemo(() => {
    void tick
    return loadPlanner(fyEndYear)
  }, [fyEndYear, tick])

  const readiness = useMemo(
    () =>
      buildAuditReadiness({
        fyEndYear,
        planner,
        evidence,
        sampleDays,
      }),
    [evidence, fyEndYear, planner, sampleDays],
  )

  const preview = useMemo(() => {
    if (!summary) return null
    return buildAuditPackageData({
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
      options: { includeReceiptThumbnails },
    })
  }, [evidence, fyEndYear, includeReceiptThumbnails, label, planner, sampleDays, summary, user])

  const refresh = useCallback(() => setTick((t) => t + 1), [])

  const generate = useCallback(async () => {
    setError(false)
    setLastZipName(null)
    try {
      const result = await generateAuditPackage({
        fyEndYear,
        fyLabel: label,
        user,
        options: { includeReceiptThumbnails },
        onPhase: setPhase,
      })
      setLastZipName(result.zipFileName)
      setJobs(listExportJobs())
      setPhase(null)
      refresh()
    } catch {
      setJobs(listExportJobs())
      setPhase(null)
      setError(true)
    }
  }, [fyEndYear, includeReceiptThumbnails, label, refresh, user])

  const removeJob = useCallback((id: string) => {
    deleteExportJob(id)
    setJobs(listExportJobs())
  }, [])

  return {
    fyEndYear,
    label,
    summary,
    evidence,
    readiness,
    preview,
    phase,
    error,
    lastZipName,
    jobs,
    canGenerate: Boolean(summary),
    includeReceiptThumbnails,
    setIncludeReceiptThumbnails,
    generate,
    removeJob,
    refresh,
  }
}
