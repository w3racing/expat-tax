import type { CalculationTrace } from '@/features/tax-position/engine'
import { AppCard } from '@/shared/components/ajx/app-card'
import { formatAud, formatDateYmd } from '@/shared/lib/format'
import { cn } from '@/shared/lib/cn'

type CalculationTraceRowProps = {
  trace: CalculationTrace
  expanded: boolean
  onToggle: () => void
}

export function CalculationTraceRow({ trace, expanded, onToggle }: CalculationTraceRowProps) {
  const lines = trace.lines ?? []
  const hasLines = lines.length > 0

  return (
    <button
      aria-expanded={expanded}
      className="w-full text-left"
      type="button"
      onClick={onToggle}
    >
      <AppCard className={cn('transition-colors hover:bg-muted/40', expanded && 'ring-1 ring-border')}>
        <div className="flex items-baseline justify-between gap-3">
          <p className="text-sm font-semibold text-foreground">{trace.label}</p>
          <p className="text-amount text-sm font-medium">{formatAud(trace.resultAud)}</p>
        </div>
        {expanded ? (
          <div className="mt-3 space-y-3 border-t border-border pt-3 text-xs leading-relaxed">
            {hasLines ? (
              <div>
                <p className="text-overline">Claims</p>
                <ul className="mt-2 space-y-2">
                  {lines.map((line) => {
                    const dateLabel = formatDateYmd(line.dateYmd)
                    return (
                      <li
                        key={line.id}
                        className="flex items-start justify-between gap-3 border-b border-border/60 pb-2 last:border-0 last:pb-0"
                      >
                        <div className="min-w-0">
                          {dateLabel ? (
                            <p className="font-medium text-foreground">{dateLabel}</p>
                          ) : (
                            <p className="text-muted-foreground">No date</p>
                          )}
                          <p className="mt-0.5 text-muted-foreground">{line.description}</p>
                          {line.currencyNote ? (
                            <p className="mt-0.5 text-[11px] text-muted-foreground">{line.currencyNote}</p>
                          ) : null}
                        </div>
                        <p className="shrink-0 text-amount font-medium text-foreground">
                          {formatAud(line.amountAud)}
                        </p>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ) : null}
            <dl className="space-y-2">
              <div>
                <dt className="text-overline">Source</dt>
                <dd className="mt-0.5 text-muted-foreground">{trace.source}</dd>
              </div>
              <div>
                <dt className="text-overline">Calculation</dt>
                <dd className="mt-0.5 text-muted-foreground">{trace.calculation}</dd>
              </div>
              <div>
                <dt className="text-overline">Result</dt>
                <dd className="mt-0.5 font-medium text-foreground text-amount">
                  {formatAud(trace.resultAud)}
                </dd>
              </div>
            </dl>
          </div>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">
            {hasLines
              ? `Tap for ${lines.length} claim${lines.length === 1 ? '' : 's'} · source · calculation`
              : 'Tap for source · calculation · result'}
          </p>
        )}
      </AppCard>
    </button>
  )
}
