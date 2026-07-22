import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import type { AuthUser } from '@/app/providers/auth-provider'
import { collectAppBackup } from '@/features/backup/services/app-backup'
import { listSampleDaysForFy } from '@/features/destination-workspace/services/sample-day-store'
import { listEvidenceRecords } from '@/features/evidence/services/evidence-vault'
import { buildAccountantPackageData } from '@/features/export/utils/build-package-data'
import {
  accountantPdfFileName,
  generateAccountantSummaryPdf,
} from '@/features/export/services/generate-summary-pdf'
import type { AccountantPackageData } from '@/features/export/types/accountant-package'
import {
  getSummary,
  loadPlanner,
  saveExportJob,
  type ExportJobRecord,
} from '@/shared/lib/local-data-store'
import { runJob, type JobPhase } from '@/shared/integrations/job-runner'
import { ENGINE_VERSION } from '@/features/tax-position/engine'

export type AccountantExportResult = {
  job: ExportJobRecord
  packageData: AccountantPackageData
  pdfFileName: string
  zipFileName: string
}

export async function generateAccountantExport(input: {
  fyEndYear: number
  fyLabel: string
  user: AuthUser | null
  onPhase?: (phase: JobPhase) => void
}): Promise<AccountantExportResult> {
  const { fyEndYear, fyLabel, user } = input
  const pdfName = accountantPdfFileName(fyEndYear)
  const zipName = `AJX-Tax-FY${fyEndYear}-Accountant-Package.zip`

  const job: ExportJobRecord = {
    id: crypto.randomUUID(),
    fyEndYear,
    status: 'running',
    createdAt: new Date().toISOString(),
    fileName: zipName,
  }
  saveExportJob(job)

  try {
    const result = await runJob(async (onPhase) => {
      onPhase({ label: 'Collecting tax position…', progress: 15 })
      const planner = loadPlanner(fyEndYear)
      const summary = getSummary(fyEndYear)
      if (!summary) {
        throw Object.assign(new Error('No tax summary for this year'), { code: 'EXPORT_FAILED' })
      }

      onPhase({ label: 'Reviewing evidence and sample days…', progress: 35 })
      const evidence = listEvidenceRecords(fyEndYear)
      const sampleDays = listSampleDaysForFy(fyEndYear)

      const packageData = buildAccountantPackageData({
        taxpayer: {
          displayName: user?.displayName ?? 'Taxpayer',
          email: user?.email ?? '',
          userId: user?.id ?? 'local',
        },
        fyEndYear,
        fyLabel,
        planner,
        summary,
        evidence,
        sampleDays,
      })

      onPhase({ label: 'Generating professional PDF summary…', progress: 55 })
      const pdfBlob = await generateAccountantSummaryPdf(packageData)

      onPhase({ label: 'Packaging supporting files…', progress: 75 })
      const fullBackup = collectAppBackup(fyEndYear)
      const zip = new JSZip()
      zip.file(pdfName, pdfBlob)
      zip.file(
        'README.txt',
        [
          'AJX Tax — Accountant package (MVP)',
          '',
          `Financial year: ${fyLabel}`,
          `Engine: ${ENGINE_VERSION}`,
          `Export: ${packageData.exportVersion}`,
          '',
          'Contents:',
          `  • ${pdfName} — professional summary with overnight claim provenance`,
          '  • tax-summary.json — machine-readable totals + overnightClaim',
          '  • sample-days.json — destination sample days and receipts',
          '  • evidence-index.csv — document checklist',
          '  • ajx-tax-backup.json — full restore backup (Settings → Backup & restore)',
          '  • position-backup.json — TaxPlannerState only',
          '  • evidence/ — file binaries when available in this browser',
          '',
          packageData.disclaimer,
          '',
        ].join('\n'),
      )
      zip.file(
        'tax-summary.json',
        JSON.stringify(
          {
            exportVersion: packageData.exportVersion,
            engineVersion: ENGINE_VERSION,
            fyLabel,
            generatedAt: packageData.generatedAt,
            taxpayer: packageData.taxpayer,
            summary,
            overnightClaim: packageData.overnightClaim,
            evidenceCompleteness: packageData.evidence,
          },
          null,
          2,
        ),
      )
      zip.file('sample-days.json', JSON.stringify(sampleDays, null, 2))
      zip.file('ajx-tax-backup.json', JSON.stringify(fullBackup, null, 2))

      const indexRows = [
        'id,title,category,status,fileName,linkedClaim,documentDate',
        ...evidence.map((i) =>
          [
            i.id,
            `"${i.title.replaceAll('"', '""')}"`,
            i.category,
            i.processingStatus,
            i.fileName,
            i.linkedClaimId ?? '',
            i.documentDate ?? '',
          ].join(','),
        ),
      ]
      zip.file('evidence-index.csv', indexRows.join('\n'))
      zip.file('position-backup.json', JSON.stringify(planner, null, 2))

      const evidenceFolder = zip.folder('evidence')
      for (const item of evidence) {
        if (item.dataUrl && item.fileName) {
          const base64 = item.dataUrl.split(',')[1]
          if (base64) evidenceFolder?.file(item.fileName, base64, { base64: true })
        }
      }

      onPhase({ label: 'Downloading…', progress: 92 })
      saveAs(pdfBlob, pdfName)
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      saveAs(zipBlob, zipName)
      onPhase({ label: 'Done', progress: 100 })

      return { packageData, pdfFileName: pdfName, zipFileName: zipName }
    }, input.onPhase)

    const done: ExportJobRecord = {
      ...job,
      status: 'ready',
      completedAt: new Date().toISOString(),
      fileName: result.pdfFileName,
    }
    saveExportJob(done)

    return { job: done, ...result }
  } catch (err) {
    saveExportJob({
      ...job,
      status: 'failed',
      errorMessage: err instanceof Error ? err.message : 'Export failed',
    })
    throw err
  }
}
