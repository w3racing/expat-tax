import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import {
  focusOvernightCell,
  OvernightCellInput,
} from '@/features/overnight-planner/components/overnight-cell-input'
import {
  fyMonthKeys,
  monthLongLabel,
  monthShortLabel,
} from '@/features/overnight-planner/utils/fy-months'
import {
  destinationClaimAud,
  destinationNightsTotal,
  monthClaimAud,
  monthNightsTotal,
  nightsAt,
  rateMapForFy,
  sortedDestinations,
  yearClaimAud,
  yearNightsTotal,
} from '@/features/overnight-planner/utils/overnight-matrix'
import { parseDailyRateInput } from '@/features/overnight-planner/utils/parse-nights'
import type {
  DestinationRate,
  MonthAway,
  TaxDestination,
} from '@/features/tax-position/engine/types'
import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog'
import { IconButton } from '@/shared/components/ui/icon-button'
import { formatAud, formatNumber } from '@/shared/lib/format'
import { cn } from '@/shared/lib/cn'

type OvernightPlannerGridProps = {
  fyEndYear: number
  destinations: TaxDestination[]
  rates: DestinationRate[]
  monthAway: MonthAway[]
  onNightsChange: (monthKey: string, destinationId: string, nights: number) => void
  onRateChange: (destinationId: string, dailyRateAud: number) => void
  onRemoveDestination: (destinationId: string) => void
}

export function OvernightPlannerGrid({
  fyEndYear,
  destinations,
  rates,
  monthAway,
  onNightsChange,
  onRateChange,
  onRemoveDestination,
}: OvernightPlannerGridProps) {
  const months = useMemo(() => fyMonthKeys(fyEndYear), [fyEndYear])
  const dests = useMemo(() => sortedDestinations(destinations), [destinations])
  const destIds = useMemo(() => dests.map((d) => d.id), [dests])
  const rateMap = useMemo(() => rateMapForFy(rates), [rates])

  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const pendingDest = dests.find((d) => d.id === pendingDeleteId)

  const fyClaim = yearClaimAud(monthAway, rateMap, destIds)
  const fyNights = yearNightsTotal(monthAway, destIds)

  const navigate = (row: number, col: number) => {
    if (row < 0 || row >= months.length || col < 0 || col >= dests.length) return
    focusOvernightCell(row, col)
  }

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto overscroll-x-contain">
          <table className="w-max border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th
                  className={cn(
                    'sticky left-0 z-30 border-b border-border bg-card px-2.5 py-3 text-left',
                    'min-w-[3.75rem] sm:min-w-[4.25rem]',
                  )}
                  scope="col"
                >
                  <span className="text-overline">Month</span>
                </th>
                {dests.map((dest) => {
                  const rate = rateMap.get(dest.id) ?? 0
                  return (
                    <th
                      key={dest.id}
                      className="w-[4.75rem] border-b border-border bg-card px-1 py-3 text-center align-bottom sm:w-[5.25rem]"
                      scope="col"
                    >
                      <div className="mx-auto flex w-full flex-col items-center gap-1.5">
                        <div className="flex w-full items-start justify-center gap-0.5">
                          <Link
                            className="min-w-0 break-words font-display text-sm font-semibold leading-tight text-primary underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                            to={`/overnight/${dest.id}`}
                          >
                            {dest.name}
                          </Link>
                          <IconButton
                            className="size-7 shrink-0 text-muted-foreground"
                            label={`Remove ${dest.name}`}
                            onClick={() => setPendingDeleteId(dest.id)}
                          >
                            <Trash2 className="size-3.5" />
                          </IconButton>
                        </div>
                        <RateInput
                          destinationName={dest.name}
                          value={rate}
                          onCommit={(next) => onRateChange(dest.id, next)}
                        />
                        <span className="text-[0.65rem] text-muted-foreground tabular-nums">
                          {formatNumber(destinationNightsTotal(monthAway, dest.id))} n ·{' '}
                          {formatAud(destinationClaimAud(monthAway, dest.id, rate), 0)}
                        </span>
                      </div>
                    </th>
                  )
                })}
                <th
                  className={cn(
                    'sticky right-0 z-30 border-b border-l border-border bg-muted/80 px-2.5 py-3 text-right backdrop-blur-sm',
                    'min-w-[5rem] sm:min-w-[5.5rem]',
                  )}
                  scope="col"
                >
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="text-overline">Month total</span>
                    <span className="text-[0.65rem] font-medium text-muted-foreground">Claim</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {months.map((monthKey, rowIndex) => {
                const monthClaim = monthClaimAud(monthAway, monthKey, rateMap, destIds)
                const monthNights = monthNightsTotal(monthAway, monthKey, destIds)
                const short = monthShortLabel(monthKey)
                const long = monthLongLabel(monthKey)
                return (
                  <tr key={monthKey} className="group">
                    <th
                      className={cn(
                        'sticky left-0 z-20 border-b border-border bg-card px-2.5 py-2 text-left',
                        'group-hover:bg-muted/40',
                      )}
                      scope="row"
                    >
                      <span className="font-display text-sm font-semibold text-foreground">
                        {short}
                      </span>
                      <span className="mt-0.5 block text-[0.65rem] text-muted-foreground">
                        {monthKey.slice(0, 4)}
                      </span>
                    </th>
                    {dests.map((dest, colIndex) => (
                      <td
                        key={dest.id}
                        className="w-[4.75rem] border-b border-border bg-card px-1 py-1.5 group-hover:bg-muted/20 sm:w-[5.25rem]"
                      >
                        <OvernightCellInput
                          colIndex={colIndex}
                          destinationId={dest.id}
                          destinationName={dest.name}
                          monthKey={monthKey}
                          monthLabel={long}
                          rowIndex={rowIndex}
                          value={nightsAt(monthAway, monthKey, dest.id)}
                          onCommit={(nights) => onNightsChange(monthKey, dest.id, nights)}
                          onNavigate={navigate}
                        />
                      </td>
                    ))}
                    <td
                      className={cn(
                        'sticky right-0 z-20 border-b border-l border-border bg-muted/70 px-2.5 py-2 text-right backdrop-blur-sm',
                        'group-hover:bg-muted/90',
                      )}
                    >
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="font-display text-sm font-semibold tabular-nums text-foreground">
                          {formatAud(monthClaim, 0)}
                        </span>
                        <span className="text-[0.65rem] text-muted-foreground tabular-nums">
                          {monthNights > 0 ? `${formatNumber(monthNights)} nights` : '—'}
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr>
                <th
                  className="sticky left-0 z-20 border-t border-border bg-primary-soft/50 px-2.5 py-3 text-left dark:bg-primary/15"
                  scope="row"
                >
                  <span className="font-display text-sm font-semibold text-foreground">FY total</span>
                </th>
                {dests.map((dest) => {
                  const rate = rateMap.get(dest.id) ?? 0
                  return (
                    <td
                      key={dest.id}
                      className="w-[4.75rem] border-t border-border bg-primary-soft/50 px-1 py-3 text-center sm:w-[5.25rem] dark:bg-primary/15"
                    >
                      <div className="text-sm font-semibold tabular-nums text-foreground">
                        {formatNumber(destinationNightsTotal(monthAway, dest.id))}
                      </div>
                      <div className="text-[0.65rem] text-muted-foreground tabular-nums">
                        {formatAud(destinationClaimAud(monthAway, dest.id, rate), 0)}
                      </div>
                    </td>
                  )
                })}
                <td className="sticky right-0 z-20 border-t border-l border-border bg-primary-soft px-2.5 py-3 text-right dark:bg-primary/25">
                  <div className="font-display text-base font-semibold tabular-nums text-foreground">
                    {formatAud(fyClaim, 0)}
                  </div>
                  <div className="text-[0.65rem] text-muted-foreground tabular-nums">
                    {formatNumber(fyNights)} nights
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <ConfirmDialog
        confirmLabel="Remove destination"
        description={
          pendingDest
            ? `Remove ${pendingDest.name} and all overnight counts for this destination in the financial year?`
            : ''
        }
        destructive
        open={pendingDeleteId != null}
        title="Remove destination?"
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          if (pendingDeleteId) onRemoveDestination(pendingDeleteId)
          setPendingDeleteId(null)
        }}
      />
    </>
  )
}

function RateInput({
  value,
  destinationName,
  onCommit,
}: {
  value: number
  destinationName: string
  onCommit: (rate: number) => void
}) {
  const [text, setText] = useState(value > 0 ? String(value) : '')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setText(value > 0 ? String(value) : '')
    setError(null)
  }, [value])

  return (
    <input
      aria-invalid={error ? true : undefined}
      aria-label={`Daily rate AUD for ${destinationName}`}
      className={cn(
        'h-8 w-full rounded-lg border border-border bg-background px-1.5 text-center text-xs font-medium tabular-nums',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        error && 'border-destructive',
      )}
      inputMode="decimal"
      placeholder="$/night"
      value={text}
      onBlur={() => {
        const parsed = parseDailyRateInput(text === '' ? '0' : text)
        if (!parsed.ok) {
          setError(parsed.error)
          setText(value > 0 ? String(value) : '')
          return
        }
        setError(null)
        setText(parsed.rate > 0 ? String(parsed.rate) : '')
        if (parsed.rate !== value) onCommit(parsed.rate)
      }}
      onChange={(e) => {
        const next = e.target.value
        setText(next)
        if (next === '') {
          setError(null)
          return
        }
        const parsed = parseDailyRateInput(next)
        setError(parsed.ok ? null : parsed.error)
      }}
      onFocus={(e) => e.target.select()}
    />
  )
}
