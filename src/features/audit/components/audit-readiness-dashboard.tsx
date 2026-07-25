import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, CircleDashed, FileWarning } from 'lucide-react'
import type { AuditReadiness } from '@/features/audit/types/audit-package'
import { ReadinessRing } from '@/shared/components/ajx/readiness-ring'
import { AppCard } from '@/shared/components/ajx/app-card'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/cn'

type Props = {
  readiness: AuditReadiness
  fyLabel: string
}

export function AuditReadinessDashboard({ readiness, fyLabel }: Props) {
  const r = readiness

  return (
    <div className="space-y-4">
      <AppCard
        header={
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Audit readiness</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                How complete your evidence looks for {fyLabel} — for your agent or an ATO request.
              </p>
            </div>
            <ReadinessRing label="Audit readiness" score={r.overallPercent} size={112} />
          </div>
        }
      >
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Evidence documents" value={String(r.evidenceCounts.total)} />
          <Metric
            label="Claims linked"
            value={`${r.evidenceCounts.linkedClaims}/${r.evidenceCounts.claimCount}`}
          />
          <Metric
            label="Sample days"
            value={`${r.sampleDayCompleteness.completed}/${r.sampleDayCompleteness.total || '—'} · ${r.sampleDayCompleteness.percent}%`}
          />
          <Metric
            label="Income evidence"
            value={
              r.incomeCompleteness.hasIncome
                ? `${r.incomeCompleteness.payslipDocuments} payslip(s) · ${r.incomeCompleteness.percent}%`
                : 'No employment income'
            }
          />
        </dl>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <StatBlock
            label="Roster uploads"
            value={
              r.rosterUploads.hasAny
                ? `${r.rosterUploads.count} document(s)`
                : 'None uploaded'
            }
            hint="Rosters are evidence only. Overnight counts remain the source of truth."
          />
          <StatBlock
            label="Package folders with files"
            value={`${r.evidenceCounts.bySection.filter((s) => s.count > 0).length} / ${r.evidenceCounts.bySection.length}`}
            hint="Empty sections are still included in the ZIP as “None for this FY”."
          />
        </div>
      </AppCard>

      {(r.missingEvidence.length > 0 || r.warnings.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          {r.missingEvidence.length > 0 ? (
            <AppCard header={<h3 className="text-sm font-semibold">Missing evidence</h3>}>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {r.missingEvidence.map((item) => (
                  <li key={item} className="flex gap-2">
                    <FileWarning
                      aria-hidden
                      className="mt-0.5 size-4 shrink-0 text-destructive"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </AppCard>
          ) : null}

          {r.warnings.length > 0 ? (
            <AppCard header={<h3 className="text-sm font-semibold">Warnings</h3>}>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {r.warnings.map((item) => (
                  <li key={item} className="flex gap-2">
                    <AlertTriangle
                      aria-hidden
                      className="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </AppCard>
          ) : null}
        </div>
      )}

      {r.evidenceCounts.byCategory.length > 0 ? (
        <AppCard header={<h3 className="text-sm font-semibold">Evidence counts</h3>}>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {r.evidenceCounts.byCategory.map((row) => (
              <li
                key={row.category}
                className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm"
              >
                <span className="text-muted-foreground">{row.category}</span>
                <span className="font-medium tabular-nums text-foreground">{row.count}</span>
              </li>
            ))}
          </ul>
        </AppCard>
      ) : null}

      <AppCard header={<h3 className="text-sm font-semibold">Outstanding tasks</h3>}>
        {r.outstandingTasks.length === 0 ? (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            <p>No outstanding readiness tasks for this year. You can generate the package when ready.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {r.outstandingTasks.map((task) => (
              <li key={task.id}>
                <div
                  className={cn(
                    'flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5 text-sm',
                    task.severity === 'missing' && 'bg-destructive/5',
                    task.severity === 'warning' && 'bg-amber-500/5',
                  )}
                >
                  <span className="flex min-w-0 items-start gap-2">
                    <CircleDashed
                      aria-hidden
                      className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                    />
                    <span>{task.label}</span>
                  </span>
                  <Button asChild size="sm" variant="ghost">
                    <Link to={task.href}>Open</Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AppCard>
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 px-3 py-3">
      <dt className="text-overline">{label}</dt>
      <dd className="mt-1 font-display text-base font-semibold tracking-tight text-foreground">
        {value}
      </dd>
    </div>
  )
}

function StatBlock({
  label,
  value,
  hint,
}: {
  label: string
  value: string
  hint: string
}) {
  return (
    <div className="rounded-lg border border-border px-3 py-3">
      <p className="text-overline">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
    </div>
  )
}
