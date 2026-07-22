import { formatAud, formatNumber } from '@/shared/lib/format'
import type { DestinationWorkspaceStats } from '@/features/destination-workspace/utils/destination-stats'
import { cn } from '@/shared/lib/cn'

type DestinationStatCardsProps = {
  stats: DestinationWorkspaceStats
}

export function DestinationStatCards({ stats }: DestinationStatCardsProps) {
  const cards = [
    {
      id: 'nights',
      label: 'Qualifying overnights',
      value: formatNumber(stats.qualifyingOvernights),
      hint: 'From overnight planner',
    },
    {
      id: 'average',
      label: 'Average daily spend',
      value:
        stats.averageDailySpendAud != null
          ? formatAud(stats.averageDailySpendAud, 0)
          : '—',
      hint:
        stats.averageDailySpendAud != null
          ? 'From completed sample days'
          : 'Complete a sample day to calculate',
    },
    {
      id: 'claim',
      label: 'Current claim',
      value: formatAud(stats.currentClaimAud, 0),
      hint: stats.rateFromSampleDays
        ? `Overnights × average daily spend`
        : `Overnights × ${formatAud(stats.dailyRateAud, 0)} daily rate`,
      emphasize: true,
    },
    {
      id: 'complete',
      label: 'Sample days completed',
      value: formatNumber(stats.sampleDaysCompleted),
    },
    {
      id: 'progress',
      label: 'Sample days in progress',
      value: formatNumber(stats.sampleDaysInProgress),
    },
    {
      id: 'evidence',
      label: 'Evidence linked',
      value: formatNumber(stats.evidenceLinked),
      hint: 'Supporting documents only',
    },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <div
          key={card.id}
          className={cn(
            'rounded-2xl border px-4 py-4 shadow-sm',
            card.emphasize
              ? 'border-primary/25 bg-primary-soft/60 dark:bg-primary/15'
              : 'border-border bg-card',
          )}
        >
          <p className="text-overline">{card.label}</p>
          <p className="mt-1 font-display text-2xl font-semibold tracking-tight text-foreground tabular-nums">
            {card.value}
          </p>
          {card.hint ? (
            <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
          ) : null}
        </div>
      ))}
    </div>
  )
}
