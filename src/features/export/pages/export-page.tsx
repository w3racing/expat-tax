import { useState } from 'react'
import { FileText, Package, Trash2 } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAccountantExport } from '@/features/export/hooks/use-accountant-export'
import { PageHeader } from '@/shared/components/ajx/page-header'
import { SoftBanner } from '@/shared/components/ajx/soft-banner'
import { AppCard } from '@/shared/components/ajx/app-card'
import { EmptyState } from '@/shared/components/ajx/empty-state'
import { Button } from '@/shared/components/ui/button'
import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog'
import { ErrorBanner } from '@/shared/components/ui/error-banner'
import { JobProgress } from '@/shared/components/ui/job-progress'
import { formatAud } from '@/shared/lib/format'

export function ExportPage() {
  const exp = useAccountantExport()
  const navigate = useNavigate()
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)

  if (!exp.canExport) {
    return (
      <div className="space-y-6">
        <PageHeader
          description="Generate a professional PDF summary for your registered tax agent."
          title="Accountant export"
        />
        <EmptyState
          actionLabel="Open Tax Position"
          description="Add income or import an AJX Tax backup first. The export needs a calculated tax summary for this financial year."
          title="Nothing to export yet"
          onAction={() => navigate('/position')}
        />
        <div className="flex justify-center">
          <Button asChild variant="ghost">
            <Link to="/migration">Import backup</Link>
          </Button>
        </div>
      </div>
    )
  }

  const preview = exp.preview!
  const pendingJob = pendingDeleteId
    ? exp.jobs.find((job) => job.id === pendingDeleteId)
    : undefined

  return (
    <div className="space-y-6">
      <PageHeader
        description="Professional PDF working papers for your tax agent — plus a ZIP with supporting files."
        title="Accountant export"
      />

      <SoftBanner tone="info">
        MVP delivers the accountant summary PDF. Later: audit packages, accountant portal, and full
        evidence bundles.
      </SoftBanner>

      {exp.error ? <ErrorBanner code="EXPORT_FAILED" onAction={() => void exp.generate()} /> : null}

      {exp.lastPdfName ? (
        <SoftBanner tone="success">
          Downloaded <strong>{exp.lastPdfName}</strong> and the supporting ZIP package.
        </SoftBanner>
      ) : null}

      <AppCard
        header={
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Summary for {exp.label}</h2>
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
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Income" value={formatAud(preview.summary.totalIncomeAud)} />
          <Metric label="Claims" value={formatAud(preview.summary.totalClaimsAud)} />
          <Metric label="Evidence docs" value={String(preview.evidence.documentCount)} />
          <Metric
            label="Evidence score"
            value={`${preview.evidence.completenessPercent}%`}
          />
        </dl>

        <ul className="mt-5 space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-2">
            <FileText aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
            PDF: taxpayer details, FY, income, expenses, claims, tax calculation, evidence
            completeness, notes
          </li>
          <li className="flex gap-2">
            <Package aria-hidden className="mt-0.5 size-4 shrink-0 text-primary" />
            ZIP: PDF + tax-summary.json + evidence index + position backup + files when available
          </li>
        </ul>

        <div className="mt-6 flex flex-wrap gap-2">
          <Button disabled={exp.phase != null} onClick={() => void exp.generate()}>
            Generate PDF &amp; package
          </Button>
          <Button asChild variant="outline">
            <Link to="/position/summary">Review Tax Position</Link>
          </Button>
        </div>

        {exp.phase ? (
          <div className="mt-4">
            <JobProgress
              label="Building accountant export"
              phase={exp.phase.label}
              value={exp.phase.progress}
            />
          </div>
        ) : null}
      </AppCard>

      {preview.evidence.gaps.length > 0 ? (
        <AppCard header={<h2 className="text-sm font-semibold">Notes for agent review (included in PDF)</h2>}>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {preview.evidence.gaps.map((gap) => (
              <li key={gap}>{gap}</li>
            ))}
          </ul>
          <Button asChild className="mt-4" size="sm" variant="soft">
            <Link to="/evidence">Open Evidence</Link>
          </Button>
        </AppCard>
      ) : null}

      {exp.jobs.length > 0 ? (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">Recent exports</h2>
          <ul className="space-y-2">
            {exp.jobs.slice(0, 5).map((job) => (
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
                      aria-label={`Remove export from ${new Date(job.createdAt).toLocaleString()}`}
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

      <ConfirmDialog
        confirmLabel="Remove"
        description={
          pendingJob?.fileName
            ? `This removes “${pendingJob.fileName}” from recent exports on this device. Files already downloaded to your computer are not deleted.`
            : 'This removes the export from recent history on this device. Files already downloaded to your computer are not deleted.'
        }
        destructive
        open={pendingDeleteId != null}
        title="Remove from recent exports?"
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          if (!pendingDeleteId) return
          exp.removeJob(pendingDeleteId)
          setPendingDeleteId(null)
        }}
      />
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 px-3 py-3">
      <dt className="text-overline">{label}</dt>
      <dd className="mt-1 font-display text-lg font-semibold tracking-tight text-foreground">
        {value}
      </dd>
    </div>
  )
}
