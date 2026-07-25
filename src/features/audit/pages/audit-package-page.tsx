import { useState } from 'react'
import { FileArchive, FileText, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuditPackage } from '@/features/audit/hooks/use-audit-package'
import { AuditReadinessDashboard } from '@/features/audit/components/audit-readiness-dashboard'
import { PageHeader } from '@/shared/components/ajx/page-header'
import { SoftBanner } from '@/shared/components/ajx/soft-banner'
import { AppCard } from '@/shared/components/ajx/app-card'
import { EmptyState } from '@/shared/components/ajx/empty-state'
import { Button } from '@/shared/components/ui/button'
import { Checkbox } from '@/shared/components/ui/checkbox'
import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog'
import { ErrorBanner } from '@/shared/components/ui/error-banner'
import { JobProgress } from '@/shared/components/ui/job-progress'
import { Label } from '@/shared/components/ui/label'
import { formatAud } from '@/shared/lib/format'

export function AuditPackagePage() {
  const audit = useAuditPackage()
  const navigate = useNavigate()
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  if (!audit.canGenerate) {
    return (
      <div className="space-y-6">
        <PageHeader
          description="Generate an ATO-ready audit report and evidence package for a selected financial year."
          title="ATO Audit Package"
        />
        <EmptyState
          actionLabel="Open Tax Position"
          description="Add income or overnight claims first, or restore a backup. The audit package needs a calculated tax summary for this financial year."
          title="Nothing to package yet"
          onAction={() => navigate('/position')}
        />
        <div className="flex flex-wrap justify-center gap-2">
          <Button asChild variant="ghost">
            <Link to="/settings">Back to Settings</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/migration">Import backup</Link>
          </Button>
        </div>
      </div>
    )
  }

  const preview = audit.preview!
  const pendingJob = pendingDeleteId
    ? audit.jobs.find((job) => job.id === pendingDeleteId)
    : undefined

  return (
    <div className="space-y-6">
      <PageHeader
        description="Professional audit report and sectioned evidence ZIP for your tax agent or an ATO information request."
        title="ATO Audit Package"
      />

      <SoftBanner tone="info">
        Overnight counts remain the source of truth. Rosters and receipts are organised as evidence —
        this package does not change your Tax Position calculations.
      </SoftBanner>

      {audit.error ? (
        <ErrorBanner code="EXPORT_FAILED" onAction={() => void audit.generate()} />
      ) : null}

      {audit.lastZipName ? (
        <SoftBanner tone="success">
          Downloaded <strong>{audit.lastZipName}</strong> and the Audit Report PDF.
        </SoftBanner>
      ) : null}

      <AuditReadinessDashboard fyLabel={audit.label} readiness={audit.readiness} />

      <AppCard
        header={
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Generate package · {audit.label}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {preview.taxpayer.displayName}
                {preview.taxpayer.email ? ` · ${preview.taxpayer.email}` : ''}
              </p>
            </div>
            <p className="text-amount text-sm font-semibold text-foreground">
              Est. {formatAud(preview.summary.estimatedTaxAud)}
            </p>
          </div>
        }
      >
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <FileText aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>
              <strong className="font-medium text-foreground">Audit Report.pdf</strong> — cover,
              executive summary, table of contents, Tax Position, overseas travel, sample days,
              currency conversions, evidence register, calculation provenance, and declaration.
            </span>
          </li>
          <li className="flex gap-2">
            <FileArchive aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
            <span>
              <strong className="font-medium text-foreground">Evidence ZIP</strong> — report plus
              folders 01–07. Travel uses Destinations/{'{city}'}/{'{sample day}'} and
              Transport/Airfares · Bus · Train · Taxi, plus Manifest.json with SHA-256 checksums.
            </span>
          </li>
        </ul>

        <div className="mt-5 flex items-start gap-3 rounded-lg border border-border bg-muted/30 px-3 py-3">
          <Checkbox
            checked={audit.includeReceiptThumbnails}
            id="include-thumbnails"
            onCheckedChange={(value) => audit.setIncludeReceiptThumbnails(value === true)}
          />
          <div className="grid gap-1">
            <Label className="font-medium" htmlFor="include-thumbnails">
              Include receipt thumbnails in the PDF
            </Label>
            <p className="text-xs text-muted-foreground">
              Embeds sample-day and Evidence Vault images in the report. Original files are always
              in the ZIP.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button disabled={audit.phase != null} onClick={() => void audit.generate()}>
            Generate Audit Package
          </Button>
          <Button asChild variant="outline">
            <Link to="/position">Review Tax Position</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/evidence">Open Evidence Vault</Link>
          </Button>
        </div>

        {audit.phase ? (
          <div className="mt-4">
            <JobProgress
              label="Building ATO Audit Package"
              phase={audit.phase.label}
              value={audit.phase.progress}
            />
          </div>
        ) : null}
      </AppCard>

      {audit.jobs.length > 0 ? (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">Recent packages</h2>
          <ul className="space-y-2">
            {audit.jobs.slice(0, 5).map((job) => (
              <li key={job.id}>
                <AppCard className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0">
                    FY {job.fyEndYear} · {job.status}
                    {job.fileName ? (
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                        {job.fileName}
                      </span>
                    ) : null}
                  </span>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="text-xs text-muted-foreground">
                      {new Date(job.createdAt).toLocaleString()}
                    </span>
                    <Button
                      aria-label={`Remove package from ${new Date(job.createdAt).toLocaleString()}`}
                      className="text-muted-foreground hover:text-destructive"
                      size="sm"
                      variant="ghost"
                      onClick={() => setPendingDeleteId(job.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </AppCard>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex justify-start">
        <Button asChild variant="ghost">
          <Link to="/settings">Back to Settings</Link>
        </Button>
      </div>

      <ConfirmDialog
        confirmLabel="Remove"
        description={
          pendingJob?.fileName
            ? `This removes “${pendingJob.fileName}” from recent history on this device. Files already downloaded are not deleted.`
            : 'This removes the package from recent history on this device. Files already downloaded are not deleted.'
        }
        destructive
        open={pendingDeleteId != null}
        title="Remove from recent packages?"
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          if (!pendingDeleteId) return
          audit.removeJob(pendingDeleteId)
          setPendingDeleteId(null)
        }}
      />
    </div>
  )
}
