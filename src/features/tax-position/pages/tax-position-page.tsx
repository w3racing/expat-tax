import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { PageHeader } from '@/shared/components/ajx/page-header'
import { SoftBanner } from '@/shared/components/ajx/soft-banner'
import { FySelect } from '@/shared/components/ajx/fy-select'
import { AppCard } from '@/shared/components/ajx/app-card'
import { EmptyState } from '@/shared/components/ajx/empty-state'
import { Button } from '@/shared/components/ui/button'
import { DraftStatus } from '@/shared/components/ui/draft-status'
import { useTaxPosition } from '@/features/tax-position/hooks/use-tax-position'
import { IncomePanel } from '@/features/tax-position/components/income-panel'
import { InterestIncomeEditor } from '@/features/tax-position/components/interest-income-editor'
import { FxRatesPanel } from '@/features/tax-position/components/fx-rates-panel'
import { OvernightClaimPanel } from '@/features/tax-position/components/overnight-claim-panel'
import { CalculationTraceRow } from '@/features/tax-position/components/calculation-trace-row'
import { SuperannuationEditor } from '@/features/tax-position/components/superannuation-editor'
import { YearOptionsPanel } from '@/features/tax-position/components/year-options-panel'
import {
  ClaimSectionCta,
  isClaimTraceId,
} from '@/features/tax-position/components/claim-section-cta'
import { buildOvernightClaimProvenance } from '@/features/tax-position/utils/overnight-claim-provenance'
import { listSampleDaysForFy } from '@/features/destination-workspace/services/sample-day-store'
import {
  buildCalculationTraces,
  ENGINE_VERSION,
  summarizeFromPlanner,
} from '@/features/tax-position/engine'
import { recomputeAndPersistSummary } from '@/features/tax-position/services/position-service'
import { formatAud } from '@/shared/lib/format'
import { cn } from '@/shared/lib/cn'

const SECTION_ALIASES: Record<string, string> = {
  income: 'employment-income',
  employment: 'employment-income',
  interest: 'interest-income',
  bank: 'interest-income',
  expenses: 'other-claims',
  claims: 'other-claims',
  super: 'superannuation',
  fx: 'advanced-fx',
  settings: 'advanced-year',
  year: 'advanced-year',
}

function resolveInitialSection(raw: string | null): string {
  if (!raw) return 'estimated-tax'
  return SECTION_ALIASES[raw] ?? raw
}

export function TaxPositionPage() {
  const {
    fyEndYear,
    label,
    year,
    planner,
    persisted,
    draftState,
    persistYear,
    persistPlanner,
  } = useTaxPosition()
  const [searchParams, setSearchParams] = useSearchParams()
  const requested = resolveInitialSection(
    searchParams.get('section') ?? searchParams.get('tab'),
  )
  const [expanded, setExpanded] = useState<string | null>(requested)
  const [advancedOpen, setAdvancedOpen] = useState(
    requested === 'advanced-fx' || requested === 'advanced-year',
  )

  const overnightProvenance = useMemo(() => {
    return buildOvernightClaimProvenance({
      fyEndYear,
      planner,
      sampleDays: listSampleDaysForFy(fyEndYear),
    })
  }, [fyEndYear, planner])

  const summary = useMemo(
    () => summarizeFromPlanner(planner, fyEndYear),
    [planner, fyEndYear],
  )

  const traces = useMemo(
    () => buildCalculationTraces(planner, fyEndYear),
    [planner, fyEndYear],
  )

  useEffect(() => {
    if (!summary) return
    recomputeAndPersistSummary(planner, fyEndYear, persisted?.source ?? 'recompute')
  }, [fyEndYear, planner, persisted?.source, summary])

  useEffect(() => {
    const next = resolveInitialSection(
      searchParams.get('section') ?? searchParams.get('tab'),
    )
    setExpanded(next)
    if (next === 'advanced-fx' || next === 'advanced-year') {
      setAdvancedOpen(true)
    }
  }, [searchParams])

  const hasData =
    summary != null && (summary.totalIncomeAud !== 0 || summary.totalClaimsAud !== 0)

  const material = traces.filter((t) => {
    if (t.id === 'overseas-daily') return false
    return (
      Math.abs(t.resultAud) > 0.0001 ||
      t.id === 'estimated-tax' ||
      t.id === 'employment-income' ||
      t.id === 'interest-income' ||
      t.id === 'superannuation'
    )
  })

  const toggle = (id: string) => {
    const nextId = expanded === id ? null : id
    setExpanded(nextId)
    const next = new URLSearchParams(searchParams)
    next.delete('tab')
    if (nextId == null) next.delete('section')
    else next.set('section', nextId)
    setSearchParams(next, { replace: true })
  }

  if (!summary || !hasData) {
    return (
      <div className="space-y-6">
        <PageHeader
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <DraftStatus state={draftState} />
              <FySelect />
            </div>
          }
          description={`${label} · Engine ${ENGINE_VERSION} · Indicative working paper`}
          title="Tax Position"
        />
        <SoftBanner tone="info">
          Overnight claim is the spine of this year. Add employment or bank interest when you are
          ready for an indicative tax estimate — claims stay on Claim, nights on Overnight.
        </SoftBanner>
        <OvernightClaimPanel provenance={overnightProvenance} />
        {expanded === 'employment-income' ? (
          <IncomePanel year={year} onChange={persistYear} />
        ) : expanded === 'interest-income' ? (
          <InterestIncomeEditor planner={planner} year={year} onChange={persistPlanner} />
        ) : (
          <EmptyState
            actionLabel="Add employment income"
            description="Enter USD pay months or bank interest to produce an indicative estimate with full provenance. Overnight and other claims still appear once you have them."
            secondaryAction={
              <div className="flex flex-wrap justify-center gap-2">
                <Button size="sm" variant="outline" onClick={() => toggle('interest-income')}>
                  Add bank interest
                </Button>
                <Button asChild size="sm" variant="ghost">
                  <Link to="/overnight">Open overnight planner</Link>
                </Button>
              </div>
            }
            title="Nothing to summarise yet"
            onAction={() => toggle('employment-income')}
          />
        )}
        <AdvancedBlock
          advancedOpen={advancedOpen}
          expanded={expanded}
          year={year}
          onChange={persistYear}
          onToggleAdvanced={() => setAdvancedOpen((o) => !o)}
          onToggleSection={toggle}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <DraftStatus state={draftState} />
            <FySelect />
            <Button asChild className="hidden sm:inline-flex" variant="outline">
              <Link to="/export">Accountant export</Link>
            </Button>
          </div>
        }
        description={`${label} · Engine ${ENGINE_VERSION} · Indicative working paper`}
        title="Tax Position"
      />

      <SoftBanner tone="warning">
        Not tax advice and not a lodgement. Expand any row for Source · Calculation · Result —
        edit income and super here; manage other claims in Claim.
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
          engine_version {ENGINE_VERSION}
          {persisted?.source ? ` · source ${persisted.source}` : ''}
          {persisted?.updatedAt
            ? ` · updated ${new Date(persisted.updatedAt).toLocaleString()}`
            : ''}
        </p>
      </AppCard>

      <OvernightClaimPanel provenance={overnightProvenance} />

      <div className="space-y-2">
        <h2 className="font-display text-lg font-semibold">Year breakdown</h2>
        <p className="text-sm text-muted-foreground">
          Tap a row to expand provenance. Employment, interest, and superannuation edit inline.
        </p>
        {material.map((trace) => (
          <CalculationTraceRow
            key={trace.id}
            expanded={expanded === trace.id}
            trace={trace}
            onToggle={() => toggle(trace.id)}
          >
            {trace.id === 'employment-income' ? (
              <IncomePanel year={year} onChange={persistYear} />
            ) : null}
            {trace.id === 'interest-income' ? (
              <InterestIncomeEditor planner={planner} year={year} onChange={persistPlanner} />
            ) : null}
            {trace.id === 'superannuation' ? (
              <SuperannuationEditor year={year} onChange={persistYear} />
            ) : null}
            {trace.id === 'medicare-levy' ? (
              <label className="flex min-h-11 items-center gap-3 text-sm text-foreground">
                <input
                  checked={year.includeMedicareLevy}
                  className="size-4 accent-[var(--primary)]"
                  type="checkbox"
                  onChange={(e) =>
                    persistYear({ ...year, includeMedicareLevy: e.target.checked })
                  }
                />
                Include Medicare levy (2%)
              </label>
            ) : null}
            {isClaimTraceId(trace.id) ? <ClaimSectionCta traceId={trace.id} /> : null}
            {trace.id === 'total-income' ? (
              <div className="flex flex-wrap gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link to="/position?section=employment-income">Edit employment income</Link>
                </Button>
                <Button asChild size="sm" variant="outline">
                  <Link to="/position?section=interest-income">Edit interest income</Link>
                </Button>
              </div>
            ) : null}
          </CalculationTraceRow>
        ))}
      </div>

      {summary.bracketRows.length > 0 ? (
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
      ) : null}

      <AdvancedBlock
        advancedOpen={advancedOpen}
        expanded={expanded}
        year={year}
        onChange={persistYear}
        onToggleAdvanced={() => setAdvancedOpen((o) => !o)}
        onToggleSection={toggle}
      />
    </div>
  )
}

function AdvancedBlock({
  advancedOpen,
  expanded,
  year,
  onChange,
  onToggleAdvanced,
  onToggleSection,
}: {
  advancedOpen: boolean
  expanded: string | null
  year: Parameters<typeof YearOptionsPanel>[0]['year']
  onChange: Parameters<typeof YearOptionsPanel>[0]['onChange']
  onToggleAdvanced: () => void
  onToggleSection: (id: string) => void
}) {
  return (
    <div className="space-y-3 border-t border-border pt-6">
      <button
        aria-expanded={advancedOpen}
        className="flex w-full items-center justify-between gap-3 text-left"
        type="button"
        onClick={onToggleAdvanced}
      >
        <div>
          <h2 className="font-display text-lg font-semibold">Advanced</h2>
          <p className="text-sm text-muted-foreground">
            Year options and ATO FX reference — not part of the everyday path.
          </p>
        </div>
        <ChevronDown
          aria-hidden
          className={cn(
            'size-5 shrink-0 text-muted-foreground transition-transform',
            advancedOpen && 'rotate-180',
          )}
        />
      </button>

      {advancedOpen ? (
        <div className="space-y-4">
          <AppCard className="space-y-3">
            <button
              aria-expanded={expanded === 'advanced-year'}
              className="flex w-full items-center justify-between gap-2 text-left"
              type="button"
              onClick={() => onToggleSection('advanced-year')}
            >
              <p className="text-sm font-semibold">Year options</p>
              <ChevronDown
                aria-hidden
                className={cn(
                  'size-4 text-muted-foreground transition-transform',
                  expanded === 'advanced-year' && 'rotate-180',
                )}
              />
            </button>
            {expanded === 'advanced-year' ? (
              <YearOptionsPanel year={year} onChange={onChange} />
            ) : (
              <p className="text-xs text-muted-foreground">
                Overnight override, Medicare levy, notes
              </p>
            )}
          </AppCard>

          <AppCard className="space-y-3">
            <button
              aria-expanded={expanded === 'advanced-fx'}
              className="flex w-full items-center justify-between gap-2 text-left"
              type="button"
              onClick={() => onToggleSection('advanced-fx')}
            >
              <p className="text-sm font-semibold">ATO FX reference</p>
              <ChevronDown
                aria-hidden
                className={cn(
                  'size-4 text-muted-foreground transition-transform',
                  expanded === 'advanced-fx' && 'rotate-180',
                )}
              />
            </button>
            {expanded === 'advanced-fx' ? (
              <FxRatesPanel />
            ) : (
              <p className="text-xs text-muted-foreground">
                Reference table · apply rates from income rows or Settings refresh
              </p>
            )}
          </AppCard>
        </div>
      ) : null}
    </div>
  )
}
