import { AppCard, Button, SoftBanner } from '@/shared/components'
import { formatAud } from '@/shared/lib/format'
import type { ImportWarning, PreviewSummary } from '@/features/migration/types/import'

type MigrationPreviewStepProps = {
  fileName: string
  preview: PreviewSummary
  warnings: ImportWarning[]
  skippedCount: number
  onBack: () => void
  onImport: () => void
}

export function MigrationPreviewStep({
  fileName,
  preview,
  warnings,
  skippedCount,
  onBack,
  onImport,
}: MigrationPreviewStepProps) {
  const allWarnings = warnings.length > 0 ? warnings : preview.warnings

  return (
    <div className="space-y-4">
      <AppCard
        header={
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">Preview import</h2>
            <p className="text-sm text-muted-foreground">
              {fileName} · {preview.adapterLabel} · schema {preview.exportVersion}
            </p>
          </div>
        }
      >
        <SoftBanner tone="info">
          Records will be marked <strong>{preview.provenanceLabel}</strong>. Source{' '}
          <code className="text-xs">{preview.provenanceSource}</code> · migration{' '}
          <code className="text-xs">{preview.migrationVersion}</code> · contract{' '}
          <code className="text-xs">v{preview.adapterContractVersion}</code>. Original ids are
          preserved.
        </SoftBanner>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Object.entries(preview.counts).map(([key, count]) => (
            <div className="rounded-lg border border-border bg-muted/50 px-3 py-3" key={key}>
              <p className="text-overline">{key}</p>
              <p className="font-display text-2xl font-semibold tracking-tight">{count}</p>
            </div>
          ))}
        </div>

        {preview.years.length > 0 ? (
          <div className="mt-6 space-y-2">
            <p className="text-sm font-semibold">Financial years</p>
            <ul className="space-y-2">
              {preview.years.map((year) => (
                <li
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
                  key={year.fyEndYear}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <span className="font-semibold">FY {year.fyLabel}</span>
                    {year.estimatedTaxAud != null ? (
                      <span className="text-amount text-muted-foreground">
                        Est. {formatAud(year.estimatedTaxAud)}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {year.incomeMonths} income months · {year.claimCount} claims
                    {year.mergesExisting ? ' · merges with existing year' : ' · new year'}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {preview.samples.claims.length > 0 ? (
          <div className="mt-6 space-y-2">
            <p className="text-sm font-semibold">Sample claims</p>
            <ul className="space-y-2">
              {preview.samples.claims.map((item) => (
                <li
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
                  key={item.legacyId}
                >
                  <span className="font-semibold">{item.label}</span>
                  <span className="text-muted-foreground">
                    {' '}
                    · {item.category} · {item.financialYear}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {preview.samples.evidence.length > 0 ? (
          <div className="mt-6 space-y-2">
            <p className="text-sm font-semibold">Sample evidence</p>
            <ul className="space-y-2">
              {preview.samples.evidence.map((item) => (
                <li
                  className="rounded-lg border border-border bg-card px-3 py-2 text-sm"
                  key={item.legacyId}
                >
                  <span className="font-semibold">{item.title}</span>
                  <span className="text-muted-foreground">
                    {' '}
                    · {item.type}
                    {item.occurredOn ? ` · ${item.occurredOn}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {skippedCount > 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            {skippedCount} duplicate{skippedCount === 1 ? '' : 's'} will be skipped.
          </p>
        ) : null}
      </AppCard>

      {allWarnings.length > 0 ? (
        <AppCard
          header={
            <h2 className="text-lg font-semibold tracking-tight">
              Warnings ({allWarnings.length})
            </h2>
          }
        >
          <div className="space-y-2">
            {allWarnings.map((w) => (
              <SoftBanner key={`${w.code}-${w.path ?? ''}-${w.message}`} tone="warning">
                <span className="font-mono text-xs">{w.code}</span>
                {w.path ? (
                  <>
                    {' '}
                    <span className="font-mono text-xs text-muted-foreground">{w.path}</span>
                  </>
                ) : null}
                <span className="mt-1 block text-sm">{w.message}</span>
              </SoftBanner>
            ))}
          </div>
        </AppCard>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button onClick={onBack} variant="outline">
          Back
        </Button>
        <Button onClick={onImport}>Confirm &amp; import</Button>
      </div>
    </div>
  )
}
