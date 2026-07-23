import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/shared/components/ajx/page-header'
import { SoftBanner } from '@/shared/components/ajx/soft-banner'
import { FySelect } from '@/shared/components/ajx/fy-select'
import { Button } from '@/shared/components/ui/button'
import { DraftStatus } from '@/shared/components/ui/draft-status'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs'
import { useTaxPosition } from '@/features/tax-position/hooks/use-tax-position'
import { IncomePanel } from '@/features/tax-position/components/income-panel'
import { ExpensesPanel } from '@/features/tax-position/components/expenses-panel'
import { FxRatesPanel } from '@/features/tax-position/components/fx-rates-panel'
import { YearSettingsPanel } from '@/features/tax-position/components/year-settings-panel'
import { OvernightClaimPanel } from '@/features/tax-position/components/overnight-claim-panel'
import { buildOvernightClaimProvenance } from '@/features/tax-position/utils/overnight-claim-provenance'
import { listSampleDaysForFy } from '@/features/destination-workspace/services/sample-day-store'
import { ENGINE_VERSION } from '@/features/tax-position/engine'
import { formatAud } from '@/shared/lib/format'

export function TaxPositionPage() {
  const {
    fyEndYear,
    label,
    year,
    planner,
    persisted,
    draftState,
    persistYear,
  } = useTaxPosition()
  const [searchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const initialTab =
    tabParam === 'expenses' || tabParam === 'fx' || tabParam === 'settings'
      ? tabParam
      : 'income'
  const estimate = persisted?.summary.estimatedTaxAud

  const overnightProvenance = useMemo(() => {
    return buildOvernightClaimProvenance({
      fyEndYear,
      planner,
      sampleDays: listSampleDaysForFy(fyEndYear),
    })
  }, [fyEndYear, planner])

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <DraftStatus state={draftState} />
            <FySelect />
            <Button asChild variant="soft">
              <Link to="/position/summary">Tax summary</Link>
            </Button>
          </div>
        }
        description={`${label} · Engine ${ENGINE_VERSION} · Indicative working papers`}
        title="Tax Position"
      />

      <SoftBanner tone="info">
        Overnight claim is first-class below. Expand Tax Summary for Source · Calculation · Result on
        every figure.
        {estimate != null ? ` Current estimate ${formatAud(estimate)}.` : ''}
      </SoftBanner>

      {persisted ? (
        <p className="text-xs text-muted-foreground">
          Stored · engine {persisted.engineVersion} · source {persisted.source} · updated{' '}
          {new Date(persisted.updatedAt).toLocaleString()} · created{' '}
          {new Date(persisted.createdAt).toLocaleString()}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button asChild className="min-w-[8.5rem] flex-1 sm:flex-none" variant="soft">
          <Link to="/claim">Quick claim</Link>
        </Button>
        <Button asChild className="min-w-[8.5rem] flex-1 sm:flex-none" variant="outline">
          <Link to="/overnight">Overnight</Link>
        </Button>
        <Button asChild className="hidden sm:inline-flex" variant="outline">
          <Link to="/export">Accountant export</Link>
        </Button>
        <Button asChild className="hidden sm:inline-flex" variant="ghost">
          <Link to="/migration">Import backup</Link>
        </Button>
      </div>

      <OvernightClaimPanel provenance={overnightProvenance} />

      <Tabs defaultValue={initialTab} key={initialTab}>
        <TabsList className="-mx-1 flex h-auto w-[calc(100%+0.5rem)] flex-nowrap gap-1 overflow-x-auto px-1">
          <TabsTrigger className="shrink-0 flex-none px-3.5" value="income">
            Income
          </TabsTrigger>
          <TabsTrigger className="shrink-0 flex-none px-3.5" value="expenses">
            Other expenses
          </TabsTrigger>
          <TabsTrigger className="shrink-0 flex-none px-3.5" value="fx">
            ATO FX
          </TabsTrigger>
          <TabsTrigger className="shrink-0 flex-none px-3.5" value="settings">
            Year
          </TabsTrigger>
        </TabsList>
        <TabsContent className="pt-4" value="income">
          <IncomePanel year={year} onChange={persistYear} />
        </TabsContent>
        <TabsContent className="pt-4" value="expenses">
          <ExpensesPanel year={year} onChange={persistYear} />
        </TabsContent>
        <TabsContent className="pt-4" value="fx">
          <FxRatesPanel />
        </TabsContent>
        <TabsContent className="pt-4" value="settings">
          <YearSettingsPanel year={year} onChange={persistYear} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
