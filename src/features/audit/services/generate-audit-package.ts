import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import type { AuthUser } from '@/app/providers/auth-provider'
import {
  hydrateEvidenceBinaries,
  listEvidenceRecords,
} from '@/features/evidence/services/evidence-vault'
import { listSampleDaysForFy } from '@/features/destination-workspace/services/sample-day-store'
import { buildAuditPackageData } from '@/features/audit/utils/build-audit-package-data'
import {
  auditReportPdfFileName,
  generateAuditReportPdf,
} from '@/features/audit/services/generate-audit-report-pdf'
import {
  AUDIT_PACKAGE_VERSION,
  AUDIT_RULESET_VERSION,
  AUDIT_ZIP_SECTIONS,
  type AuditManifest,
  type AuditPackageData,
  type AuditPackageOptions,
  type ManifestDocument,
} from '@/features/audit/types/audit-package'
import {
  emptySectionPlaceholder,
  auditZipFolderForEvidence,
  travelFolderReadme,
  travelSubfolderForSampleDay,
} from '@/features/audit/utils/categorize-evidence'
import { sha256Hex, sha256HexFromDataUrl } from '@/features/audit/utils/sha256'
import {
  getSummary,
  loadPlanner,
  saveExportJob,
  type ExportJobRecord,
} from '@/shared/lib/local-data-store'
import { runJob, type JobPhase } from '@/shared/integrations/job-runner'
import { ENGINE_VERSION } from '@/features/tax-position/engine'

export type AuditPackageResult = {
  job: ExportJobRecord
  packageData: AuditPackageData
  pdfFileName: string
  zipFileName: string
  manifest: AuditManifest
}

function safeFileName(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, '_').trim() || 'document'
}

function uniquePath(used: Set<string>, folder: string, fileName: string): string {
  let candidate = `${folder}/${safeFileName(fileName)}`
  if (!used.has(candidate)) {
    used.add(candidate)
    return candidate
  }
  const dot = fileName.lastIndexOf('.')
  const base = dot > 0 ? fileName.slice(0, dot) : fileName
  const ext = dot > 0 ? fileName.slice(dot) : ''
  let i = 2
  while (used.has(candidate)) {
    candidate = `${folder}/${safeFileName(`${base}-${i}${ext}`)}`
    i += 1
  }
  used.add(candidate)
  return candidate
}

export async function generateAuditPackage(input: {
  fyEndYear: number
  fyLabel: string
  user: AuthUser | null
  options?: Partial<AuditPackageOptions>
  onPhase?: (phase: JobPhase) => void
}): Promise<AuditPackageResult> {
  const { fyEndYear, fyLabel, user } = input
  const options: AuditPackageOptions = {
    includeReceiptThumbnails: input.options?.includeReceiptThumbnails ?? false,
  }
  const pdfName = 'Audit Report.pdf'
  const zipName = `AJX-Tax-FY${fyEndYear}-ATO-Audit-Package.zip`
  const exportDate = new Date().toISOString()

  const job: ExportJobRecord = {
    id: crypto.randomUUID(),
    fyEndYear,
    status: 'running',
    createdAt: exportDate,
    fileName: zipName,
  }
  saveExportJob(job)

  try {
    const result = await runJob(async (onPhase) => {
      onPhase({ label: 'Collecting Tax Position…', progress: 12 })
      const planner = loadPlanner(fyEndYear)
      const summary = getSummary(fyEndYear)
      if (!summary) {
        throw Object.assign(new Error('No tax summary for this year'), { code: 'EXPORT_FAILED' })
      }
      const year = planner.years.find((y) => y.fyEndYear === fyEndYear)

      onPhase({ label: 'Gathering evidence and sample days…', progress: 28 })
      const evidence = await hydrateEvidenceBinaries(listEvidenceRecords(fyEndYear))
      const sampleDays = listSampleDaysForFy(fyEndYear)

      const packageData = buildAuditPackageData({
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
        options,
      })

      onPhase({ label: 'Generating Audit Report PDF…', progress: 48 })
      const pdfBlob = await generateAuditReportPdf(packageData)

      onPhase({ label: 'Building evidence folders…', progress: 68 })
      const zip = new JSZip()
      zip.file(pdfName, pdfBlob)

      for (const section of AUDIT_ZIP_SECTIONS) {
        zip.folder(section)
      }
      zip.file('03 Travel/README.txt', travelFolderReadme())

      // Tax Position working papers (not claim maths changes)
      zip.file(
        '01 Tax Position/tax-position-summary.json',
        JSON.stringify(
          {
            engineVersion: ENGINE_VERSION,
            packageVersion: AUDIT_PACKAGE_VERSION,
            rulesetVersion: AUDIT_RULESET_VERSION,
            fyLabel,
            generatedAt: packageData.generatedAt,
            summary,
            overnightClaim: packageData.overnightClaim,
            income: packageData.income,
            expenses: packageData.expenses,
            readiness: packageData.readiness,
          },
          null,
          2,
        ),
      )
      zip.file(
        '01 Tax Position/calculation-provenance.json',
        JSON.stringify(packageData.traces, null, 2),
      )
      zip.file('01 Tax Position/currency-conversion-schedule.json', JSON.stringify(packageData.currencyConversions, null, 2))
      zip.file('01 Tax Position/sample-days.json', JSON.stringify(sampleDays, null, 2))

      const usedPaths = new Set<string>()
      const manifestDocs: ManifestDocument[] = []

      for (const item of evidence) {
        const folder = auditZipFolderForEvidence(
          item,
          year,
          planner.destinations,
          sampleDays,
        )
        if (!item.dataUrl || !item.fileName) continue
        const base64 = item.dataUrl.includes(',') ? item.dataUrl.split(',')[1] : null
        if (!base64) continue

        const zipPath = uniquePath(usedPaths, folder, item.fileName)
        const relativeName = zipPath.slice(folder.length + 1)
        zip.folder(folder)?.file(relativeName, base64, { base64: true })

        const sha256 = await sha256HexFromDataUrl(item.dataUrl)
        manifestDocs.push({
          documentId: item.id,
          originalFilename: item.fileName,
          sha256,
          category: item.category,
          financialYear: fyLabel,
          linkedClaim: item.linkedClaimLabel ?? item.linkedClaimId,
          uploadDate: item.createdAt,
          exportDate,
          zipPath,
        })
      }

      // Sample-day receipt images → Destinations/{dest}/{sample day label}
      for (const day of sampleDays) {
        for (const rec of day.receipts) {
          if (!rec.imageDataUrl || !rec.imageFileName) continue
          if (rec.evidenceId && evidence.some((e) => e.id === rec.evidenceId && e.dataUrl)) {
            continue
          }
          const base64 = rec.imageDataUrl.includes(',')
            ? rec.imageDataUrl.split(',')[1]
            : null
          if (!base64) continue
          const dest = planner.destinations.find((d) => d.id === day.destinationId)
          const folder = `03 Travel/${travelSubfolderForSampleDay(day, dest?.name)}`
          const zipPath = uniquePath(
            usedPaths,
            folder,
            rec.imageFileName || `${day.label}-${rec.id}.jpg`,
          )
          const relativeName = zipPath.slice(folder.length + 1)
          zip.folder(folder)?.file(relativeName, base64, { base64: true })
          const sha256 = await sha256HexFromDataUrl(rec.imageDataUrl)
          manifestDocs.push({
            documentId: rec.id,
            originalFilename: rec.imageFileName || relativeName,
            sha256,
            category: 'sample_receipt',
            financialYear: fyLabel,
            linkedClaim: `Sample day · ${day.label}`,
            uploadDate: day.createdAt,
            exportDate,
            zipPath,
          })
        }
      }

      for (const section of AUDIT_ZIP_SECTIONS) {
        if (section === '01 Tax Position') continue
        const hasFiles = manifestDocs.some((d) => d.zipPath.startsWith(`${section}/`))
        if (!hasFiles) {
          zip.file(`${section}/NONE.txt`, emptySectionPlaceholder(section))
        }
      }

      onPhase({ label: 'Writing Manifest.json…', progress: 88 })
      const manifest: AuditManifest = {
        packageId: packageData.packageId,
        packageVersion: AUDIT_PACKAGE_VERSION,
        rulesetVersion: AUDIT_RULESET_VERSION,
        fyEndYear,
        fyLabel,
        generatedAt: packageData.generatedAt,
        taxpayer: packageData.taxpayer,
        documentCount: manifestDocs.length,
        documents: manifestDocs,
      }
      const manifestJson = JSON.stringify(manifest, null, 2)
      zip.file('Manifest.json', manifestJson)

      onPhase({ label: 'Downloading package…', progress: 94 })
      const pdfBuf = new Uint8Array(await pdfBlob.arrayBuffer())
      const reportSha = await sha256Hex(pdfBuf)
      zip.file(
        '01 Tax Position/Audit-Report-checksum.txt',
        `Audit Report.pdf\nSHA-256: ${reportSha}\n`,
      )

      saveAs(pdfBlob, auditReportPdfFileName(fyEndYear))
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      saveAs(zipBlob, zipName)
      onPhase({ label: 'Done', progress: 100 })

      return {
        packageData,
        pdfFileName: auditReportPdfFileName(fyEndYear),
        zipFileName: zipName,
        manifest,
      }
    }, input.onPhase)

    const done: ExportJobRecord = {
      ...job,
      status: 'ready',
      completedAt: new Date().toISOString(),
      fileName: result.zipFileName,
    }
    saveExportJob(done)

    return { job: done, ...result }
  } catch (err) {
    saveExportJob({
      ...job,
      status: 'failed',
      errorMessage: err instanceof Error ? err.message : 'Audit package failed',
    })
    throw err
  }
}
