import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useFy } from '@/app/providers/fy-provider'
import { PageHeader } from '@/shared/components/ajx/page-header'
import { AppCard } from '@/shared/components/ajx/app-card'
import { SoftBanner } from '@/shared/components/ajx/soft-banner'
import { Button } from '@/shared/components/ui/button'
import { EmptyState } from '@/shared/components/ajx/empty-state'
import { CalculationTraceRow } from '@/features/tax-position/components/calculation-trace-row'
import {
  getPersistedSummary,
  loadTaxPlanner,
  recomputeAndPersistSummary,
} from '@/features/tax-position/services/position-service'
import { buildCalculationTraces, ENGINE_VERSION, summarizeFromPlanner } from '@/features/tax-position/engine'
import { formatAud } from '@/shared/lib/format'

export function TaxSummaryPage() {
  const { fyEndYear, label } = useFy()
  const navigate = useNavigate()
  const [expanded, setExpanded] = useState<string | null>('estimated-tax')

  const live = useMemo(() => {
    const planner = loadTaxPlanner(fyEndYear)
    const summary = summarizeFromPlanner(planner, fyEndYear)
    const traces = buildCalculationTraces(planner, fyEndYear)
    const persisted = getPersistedSummary(fyEndYear)
    return { planner, summary, traces, persisted }
  }, [fyEndYear])

  useEffect(() => {
    if (!live.summary) return
    recomputeAndPersistSummary(live.planner, fyEndYear, live.persisted?.source ?? 'recompute')
  }, [fyEndYear, live.planner, live.persisted?.source, live.summary])

  const { summary, traces, persisted } = live
  const engineVersion = summary?.engineVersion || persisted?.engineVersion || ENGINE_VERSION
  const hasData = summary != null && (summary.totalIncomeAud !== 0 || summary.totalClaimsAud !== 0)

  if (!summary) {
    return (
      <div className="space-y-6">
        <PageHeader description={label} title="Tax summary" />
        <EmptyState
          actionLabel="Open Tax Position"
          description="No saved summary for this year yet. Add income or import a backup, then return here for Source · Calculation · Result."
          title="Nothing to summarise yet"
          onAction={() => navigate('/position')}
        />
      </div>
    )
  }

  if (!hasData) {
    return (
      <div className="space-y-6">
        <PageHeader description={label} title="Tax summary" />
        <EmptyState
          actionLabel="Open Tax Position"
          description="Add income or import an AJX backup to produce an indicative summary with full provenance."
          title="Nothing to summarise yet"
          onAction={() => navigate('/position')}
        />
      </div>
    )
  }

  const material = traces.filter((t) => Math.abs(t.resultAud) > 0.0001 || t.id === 'estimated-tax')

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button asChild variant="outline">
            <Link to="/position">Edit position</Link>
          </Button>
        }
        description={`${label} · Engine ${engineVersion} · Indicative working paper`}
        title="Tax summary"
      />

      <SoftBanner tone="warning">
        Not tax advice and not a lodgement. Expand claim rows to see each date, description, and
        amount — then Source · Calculation · Result.
      </SoftBanner>

      <AppCard className="space-y-2">
        <p className="text-overline">Estimated tax payable</p>
        <p className="font-display text-4xl font-semibold tracking-tight text-amount">
          {formatAud(summary.estimatedTaxAud)}
        </p>
        <p className="text-sm text-muted-foreground">
          PAYG / pay (24): {formatAud(summary.paygPerPay)} · Effective rate{' '}
          {(summary.effectiveRate * 100).toFixed(2)}%
        </p>
        <p className="text-xs text-muted-foreground">
          engine_version {engineVersion}
          {persisted?.source ? ` · source ${persisted.source}` : ''}
          {persisted?.createdAt
            ? ` · created ${new Date(persisted.createdAt).toLocaleString()}`
            : ''}
          {persisted?.updatedAt
            ? ` · updated ${new Date(persisted.updatedAt).toLocaleString()}`
            : ''}
        </p>
      </AppCard>

      <div className="space-y-2">
        <h2 className="font-display text-lg font-semibold">Calculation provenance</h2>
        {material.map((trace) => (
          <CalculationTraceRow
            key={trace.id}
            expanded={expanded === trace.id}
            trace={trace}
            onToggle={() => setExpanded(expanded === trace.id ? null : trace.id)}
          />
        ))}
      </div>

      <AppCard>
        <p className="text-overline mb-3">Bracket rows</p>
        <ul className="space-y-2">
          {summary.bracketRows.map((b) => (
            <li key={`${b.from}-${b.rate}`} className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {formatAud(b.from, 0)} – {b.to == null ? '∞' : formatAud(b.to, 0)} @{' '}
                {(b.rate * 100).toFixed(0)}%
              </span>
              <span className="text-amount">{formatAud(b.taxAud)}</span>
            </li>
          ))}
        </ul>
      </AppCard>
    </div>
  )
}
