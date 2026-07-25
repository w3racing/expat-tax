import { useState, type ReactNode } from 'react'
import { ChevronDown, Pencil, Trash2 } from 'lucide-react'
import type { CalculationTrace } from '@/features/tax-position/engine'
import type { ClaimReviewLine } from '@/features/tax-position/engine/types'
import { AppCard } from '@/shared/components/ajx/app-card'
import { Button } from '@/shared/components/ui/button'
import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog'
import { formatAud, formatDateYmd } from '@/shared/lib/format'
import { cn } from '@/shared/lib/cn'

type CalculationTraceRowProps = {
  trace: CalculationTrace
  expanded: boolean
  onToggle: () => void
  /** Interactive edit / CTA content shown when expanded (outside the toggle control). */
  children?: ReactNode
  /** When set, claim lines show an edit control. */
  onEditClaim?: (line: ClaimReviewLine) => void
  /** When set, claim lines show a remove control (confirm handled here). */
  onRemoveClaim?: (line: ClaimReviewLine) => void
}

type ClaimLineGroup = {
  key: string
  label: string
  amountAud: number
  pendingAud: boolean
  lines: ClaimReviewLine[]
}

function groupClaimLines(lines: ClaimReviewLine[]): ClaimLineGroup[] | null {
  const hasGroups = lines.some((line) => line.groupKey && line.groupLabel)
  if (!hasGroups) return null

  const groups: ClaimLineGroup[] = []
  const byKey = new Map<string, ClaimLineGroup>()

  for (const line of lines) {
    const key = line.groupKey ?? 'other'
    const label = line.groupLabel ?? 'Other'
    let group = byKey.get(key)
    if (!group) {
      group = { key, label, amountAud: 0, pendingAud: true, lines: [] }
      byKey.set(key, group)
      groups.push(group)
    }
    group.lines.push(line)
    group.amountAud += line.amountAud
    if (!line.pendingAud) group.pendingAud = false
  }

  return groups
}

function formatClaimAud(amountAud: number, pendingAud?: boolean) {
  if (pendingAud) return 'Pending'
  return formatAud(amountAud)
}

function ClaimLineItem({
  line,
  onEdit,
  onRemove,
}: {
  line: ClaimReviewLine
  onEdit?: (line: ClaimReviewLine) => void
  onRemove?: (line: ClaimReviewLine) => void
}) {
  const dateLabel = formatDateYmd(line.dateYmd)
  return (
    <li className="flex items-start justify-between gap-3 border-b border-border/60 pb-2 last:border-0 last:pb-0">
      <div className="min-w-0 flex-1">
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
      <div className="flex shrink-0 items-start gap-0.5">
        <p className="text-amount self-start pt-1.5 font-medium text-foreground">
          {formatClaimAud(line.amountAud, line.pendingAud)}
        </p>
        {onEdit ? (
          <Button
            aria-label={`Edit claim ${line.description}`}
            className="text-muted-foreground hover:text-foreground"
            size="sm"
            type="button"
            variant="ghost"
            onClick={() => onEdit(line)}
          >
            <Pencil className="size-4" />
          </Button>
        ) : null}
        {onRemove ? (
          <Button
            aria-label={`Remove claim ${line.description}`}
            className="text-muted-foreground hover:text-destructive"
            size="sm"
            type="button"
            variant="ghost"
            onClick={() => onRemove(line)}
          >
            <Trash2 className="size-4" />
          </Button>
        ) : null}
      </div>
    </li>
  )
}

export function CalculationTraceRow({
  trace,
  expanded,
  onToggle,
  children,
  onEditClaim,
  onRemoveClaim,
}: CalculationTraceRowProps) {
  const [pendingDelete, setPendingDelete] = useState<ClaimReviewLine | null>(null)
  const lines = trace.lines ?? []
  const hasLines = lines.length > 0
  const groups = hasLines ? groupClaimLines(lines) : null
  const pendingCount = lines.filter((line) => line.pendingAud).length
  const allPending = hasLines && pendingCount === lines.length
  const somePending = pendingCount > 0
  const canEdit = onEditClaim != null
  const canRemove = onRemoveClaim != null

  return (
    <AppCard className={cn('transition-colors', expanded && 'ring-1 ring-border')}>
      <button
        aria-expanded={expanded}
        className="-m-1 flex w-[calc(100%+0.5rem)] items-start justify-between gap-3 rounded-xl p-1 text-left transition-colors hover:bg-muted/40"
        type="button"
        onClick={onToggle}
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{trace.label}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {expanded
              ? 'Hide detail'
              : hasLines
                ? `Tap for ${lines.length} claim${lines.length === 1 ? '' : 's'}${
                    somePending
                      ? ` · ${pendingCount} pending FX`
                      : ' · source · calculation'
                  }`
                : 'Tap for source · calculation · result'}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <p className="text-amount text-sm font-medium">
            {formatClaimAud(trace.resultAud, allPending)}
          </p>
          <ChevronDown
            aria-hidden
            className={cn(
              'size-4 text-muted-foreground transition-transform',
              expanded && 'rotate-180',
            )}
          />
        </div>
      </button>

      {expanded ? (
        <div className="mt-3 space-y-3 border-t border-border pt-3">
          {hasLines ? (
            <div className="text-xs leading-relaxed">
              <p className="text-overline">Claims</p>
              {groups ? (
                <div className="mt-2 space-y-4">
                  {groups.map((group) => (
                    <div key={group.key}>
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="text-sm font-semibold text-foreground">{group.label}</p>
                        <p className="shrink-0 text-amount text-sm font-medium text-foreground">
                          {formatClaimAud(group.amountAud, group.pendingAud)}
                        </p>
                      </div>
                      <ul className="mt-2 space-y-2">
                        {group.lines.map((line) => (
                          <ClaimLineItem
                            key={line.id}
                            line={line}
                            onEdit={canEdit ? onEditClaim : undefined}
                            onRemove={canRemove ? setPendingDelete : undefined}
                          />
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <ul className="mt-2 space-y-2">
                  {lines.map((line) => (
                    <ClaimLineItem
                      key={line.id}
                      line={line}
                      onEdit={canEdit ? onEditClaim : undefined}
                      onRemove={canRemove ? setPendingDelete : undefined}
                    />
                  ))}
                </ul>
              )}
            </div>
          ) : null}
          <dl className="space-y-2 text-xs leading-relaxed">
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
                {formatClaimAud(trace.resultAud, allPending)}
              </dd>
            </div>
          </dl>
          {children ? <div className="pt-1 text-sm">{children}</div> : null}
        </div>
      ) : null}

      <ConfirmDialog
        confirmLabel="Remove"
        description={
          pendingDelete
            ? `This removes “${pendingDelete.description}”${
                pendingDelete.dateYmd ? ` (${formatDateYmd(pendingDelete.dateYmd)})` : ''
              } from your tax position. You can undo immediately after.`
            : 'This removes the claim from your tax position. You can undo immediately after.'
        }
        destructive
        open={pendingDelete != null}
        title="Remove this claim?"
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => {
          if (!pendingDelete || !onRemoveClaim) return
          const line = pendingDelete
          setPendingDelete(null)
          onRemoveClaim(line)
        }}
      />
    </AppCard>
  )
}
