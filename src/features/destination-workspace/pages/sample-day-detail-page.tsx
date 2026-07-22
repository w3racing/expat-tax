import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus } from 'lucide-react'
import { useDestinationWorkspace } from '@/features/destination-workspace/hooks/use-destination-workspace'
import {
  SampleDayWorkflowSteps,
  workflowStepIndex,
} from '@/features/destination-workspace/components/sample-day-workflow-steps'
import { SampleDayReceiptCard } from '@/features/destination-workspace/components/sample-day-receipt-card'
import { RunningDailyTotalBar } from '@/features/destination-workspace/components/running-daily-total-bar'
import {
  addReceipt,
  duplicateReceipt,
  getSampleDay,
  removeReceipt,
  setLinkedEvidenceIds,
  updateReceipt,
  updateSampleDay,
} from '@/features/destination-workspace/services/sample-day-store'
import {
  completionStatusLabel,
  primaryCurrency,
  sampleDayTotalAud,
  type SampleDay,
} from '@/features/destination-workspace/types/sample-day'
import { listEvidenceRecords } from '@/features/evidence/services/evidence-vault'
import { PageHeader } from '@/shared/components/ajx/page-header'
import { EmptyState } from '@/shared/components/ajx/empty-state'
import { AppCard } from '@/shared/components/ajx/app-card'
import { SectionHeader } from '@/shared/components/ajx/section-header'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog'
import { SoftBanner } from '@/shared/components/ajx/soft-banner'
import { formatAud, formatNumber } from '@/shared/lib/format'
import { cn } from '@/shared/lib/cn'

export function SampleDayDetailPage() {
  const { destinationId, sampleDayId } = useParams<{
    destinationId: string
    sampleDayId: string
  }>()
  const navigate = useNavigate()
  const workspace = useDestinationWorkspace(destinationId)
  const [day, setDay] = useState<SampleDay | null>(null)
  const [confirmComplete, setConfirmComplete] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmEdit, setConfirmEdit] = useState(false)
  const [focusReceiptId, setFocusReceiptId] = useState<string | null>(null)

  const handleAddReceipt = () => {
    if (!day) return
    const next = addReceipt(day.id)
    if (next) {
      setDay(next)
      setFocusReceiptId(next.receipts[0]?.id ?? null)
    }
  }

  const reload = () => {
    if (!sampleDayId) return
    setDay(getSampleDay(sampleDayId))
    workspace.refresh()
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sampleDayId])

  const evidenceOptions = useMemo(() => {
    if (!destinationId || !workspace.fyEndYear) return []
    return listEvidenceRecords(workspace.fyEndYear).filter(
      (e) => e.destinationId === destinationId || !e.destinationId,
    )
  }, [destinationId, workspace.fyEndYear, day?.updatedAt])

  if (!destinationId || !sampleDayId) {
    return <Navigate replace to="/overnight" />
  }

  if (!workspace.destination) {
    return (
      <EmptyState
        actionLabel="Back"
        description="This destination is no longer in your overnight planner."
        title="Destination not found"
        onAction={() => navigate('/overnight')}
      />
    )
  }

  if (!day) {
    return (
      <EmptyState
        actionLabel="View sample days"
        description="This sample day was removed or never saved."
        title="Sample day not found"
        onAction={() => navigate(`/overnight/${destinationId}/sample-days`)}
      />
    )
  }

  const readOnly = day.status === 'complete'
  const totalAud = sampleDayTotalAud(day)
  const currency = primaryCurrency(day)
  const stepIndex = workflowStepIndex({
    receiptCount: day.receipts.length,
    status: day.status,
  })
  const linkedCount =
    day.linkedEvidenceIds.length + day.receipts.filter((r) => r.evidenceId).length

  return (
    <div className="space-y-6 md:space-y-8">
      <PageHeader
        actions={
          <Button asChild size="sm" variant="ghost">
            <Link to={`/overnight/${destinationId}/sample-days`}>
              <ArrowLeft className="size-4" />
              All sample days
            </Link>
          </Button>
        }
        description={`${workspace.destination.name} · ${completionStatusLabel(day.status)}`}
        title={day.label}
      />

      <AppCard className="space-y-4">
        <SectionHeader
          description="A clear path from receipts to your destination average"
          title="How this works"
        />
        <SampleDayWorkflowSteps activeIndex={stepIndex} completed={readOnly} />
      </AppCard>

      {readOnly ? (
        <SoftBanner tone="success">
          This sample day is complete. Its total is included in the average for{' '}
          {workspace.destination.name}, and your Tax Position has been updated. Choose “Make
          changes” if you need to edit it.
        </SoftBanner>
      ) : (
        <SoftBanner tone="info">
          Add the receipts for a typical day away. When you complete the day, the average updates
          straight away and your Tax Position follows.
        </SoftBanner>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryTile label="Receipt count" value={formatNumber(day.receipts.length)} />
        <SummaryTile label="Currency" value={currency} />
        <SummaryTile label="Daily total (AUD)" value={formatAud(totalAud, 2)} emphasize />
        <SummaryTile label="AUD equivalent" value={formatAud(totalAud, 2)} />
        <SummaryTile label="Completion status" value={completionStatusLabel(day.status)} />
        <SummaryTile
          label="Linked evidence"
          value={linkedCount === 0 ? 'None yet' : formatNumber(linkedCount)}
        />
      </div>

      <div className="space-y-2 rounded-2xl border border-border bg-card px-4 py-4 shadow-sm">
        <Label htmlFor="day-label">Name for this day</Label>
        <Input
          disabled={readOnly}
          id="day-label"
          placeholder="e.g. Tokyo layover — 12 Sep"
          value={day.label}
          onChange={(e) => {
            const next = updateSampleDay(day.id, { label: e.target.value })
            if (next) setDay(next)
          }}
        />
      </div>

      <div className="space-y-4 pb-28 md:pb-8">
        <div className="flex items-center justify-between gap-3">
          <SectionHeader
            description="Clean cards · tap amount · duplicate to go faster"
            title="Enter receipts"
          />
          {!readOnly ? (
            <Button className="hidden min-h-11 sm:inline-flex" size="sm" variant="soft" onClick={handleAddReceipt}>
              <Plus className="size-4" />
              Add receipt
            </Button>
          ) : null}
        </div>

        {day.receipts.length === 0 ? (
          <EmptyState
            actionLabel={readOnly ? undefined : 'Add receipt'}
            description="Start with meals, transport, or incidentals. Amount is front and centre for quick mobile entry."
            title="No receipts yet"
            onAction={readOnly ? undefined : handleAddReceipt}
          />
        ) : (
          <ul className="space-y-4">
            {day.receipts.map((receipt) => (
              <li key={receipt.id}>
                <SampleDayReceiptCard
                  autoFocusAmount={focusReceiptId === receipt.id}
                  readOnly={readOnly}
                  receipt={receipt}
                  onChange={(patch) => {
                    const next = updateReceipt(day.id, receipt.id, patch)
                    if (next) setDay(next)
                  }}
                  onDuplicate={() => {
                    const beforeIds = new Set(day.receipts.map((r) => r.id))
                    const next = duplicateReceipt(day.id, receipt.id)
                    if (next) {
                      setDay(next)
                      const created = next.receipts.find((r) => !beforeIds.has(r.id))
                      setFocusReceiptId(created?.id ?? null)
                    }
                  }}
                  onRemove={() => {
                    const next = removeReceipt(day.id, receipt.id)
                    if (next) setDay(next)
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </div>

      {!readOnly ? (
        <RunningDailyTotalBar
          readOnly={readOnly}
          receiptCount={day.receipts.length}
          totalAud={totalAud}
          onAddReceipt={handleAddReceipt}
        />
      ) : (
        <div className="rounded-2xl border border-border bg-card px-4 py-4 shadow-sm">
          <p className="text-overline">Daily total</p>
          <p className="mt-1 font-display text-3xl font-semibold tabular-nums">
            {formatAud(totalAud, 2)}
          </p>
        </div>
      )}

      <AppCard className="space-y-4">
        <SectionHeader description="Check before you complete" title="Review totals" />
        <div className="rounded-xl border border-border bg-muted/40 px-4 py-4">
          <p className="text-overline">Daily total (AUD)</p>
          <p className="mt-1 font-display text-3xl font-semibold tabular-nums text-foreground">
            {formatAud(totalAud, 2)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatNumber(day.receipts.length)} receipt
            {day.receipts.length === 1 ? '' : 's'}
          </p>
        </div>
      </AppCard>

      <div className="space-y-2 rounded-2xl border border-border bg-card px-4 py-4 shadow-sm">
        <Label htmlFor="day-notes">Notes</Label>
        <Textarea
          disabled={readOnly}
          id="day-notes"
          placeholder="Anything helpful for you or your accountant later"
          value={day.notes}
          onChange={(e) => {
            const next = updateSampleDay(day.id, { notes: e.target.value })
            if (next) setDay(next)
          }}
        />
      </div>

      <AppCard className="space-y-3">
        <SectionHeader
          description="Optional — attach documents from Evidence Vault"
          title="Linked evidence"
        />
        {evidenceOptions.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No evidence uploaded yet.{' '}
            <Link
              className="font-medium text-primary underline-offset-2 hover:underline"
              to={`/evidence?destination=${encodeURIComponent(destinationId)}`}
            >
              Upload evidence
            </Link>
          </p>
        ) : (
          <ul className="space-y-2">
            {evidenceOptions.map((ev) => {
              const checked = day.linkedEvidenceIds.includes(ev.id)
              return (
                <li key={ev.id}>
                  <label
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-xl border border-border px-3 py-3',
                      readOnly && 'cursor-default opacity-80',
                    )}
                  >
                    <input
                      checked={checked}
                      className="mt-1"
                      disabled={readOnly}
                      type="checkbox"
                      onChange={() => {
                        const nextIds = checked
                          ? day.linkedEvidenceIds.filter((id) => id !== ev.id)
                          : [...day.linkedEvidenceIds, ev.id]
                        const next = setLinkedEvidenceIds(day.id, nextIds)
                        if (next) setDay(next)
                      }}
                    />
                    <span>
                      <span className="block text-sm font-medium text-foreground">{ev.title}</span>
                      <span className="text-xs text-muted-foreground">{ev.fileName}</span>
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
        )}
      </AppCard>

      <div className="flex flex-wrap gap-2">
        {readOnly ? (
          <Button variant="outline" onClick={() => setConfirmEdit(true)}>
            Make changes
          </Button>
        ) : (
          <Button
            disabled={day.receipts.length === 0}
            onClick={() => setConfirmComplete(true)}
          >
            Complete sample day
          </Button>
        )}
        <Button variant="destructive" onClick={() => setConfirmDelete(true)}>
          Delete
        </Button>
        <Button asChild variant="ghost">
          <Link to={`/overnight/${destinationId}`}>Back to {workspace.destination.name}</Link>
        </Button>
      </div>

      <ConfirmDialog
        confirmLabel="Complete"
        description="This day becomes read-only, its total joins the destination average, and your Tax Position updates automatically. You can make changes later if needed."
        open={confirmComplete}
        title="Complete this sample day?"
        onCancel={() => setConfirmComplete(false)}
        onConfirm={() => {
          workspace.complete(day.id)
          setConfirmComplete(false)
          reload()
        }}
      />

      <ConfirmDialog
        confirmLabel="Make changes"
        description="You can edit receipts and notes again. The destination average and Tax Position will refresh when you complete the day once more."
        open={confirmEdit}
        title="Make changes to this sample day?"
        onCancel={() => setConfirmEdit(false)}
        onConfirm={() => {
          workspace.reopen(day.id)
          setConfirmEdit(false)
          reload()
        }}
      />

      <ConfirmDialog
        confirmLabel="Delete"
        description="This removes the sample day and its receipts. The destination average will update."
        destructive
        open={confirmDelete}
        title="Delete this sample day?"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          workspace.remove(day.id)
          setConfirmDelete(false)
          navigate(`/overnight/${destinationId}/sample-days`)
        }}
      />
    </div>
  )
}

function SummaryTile({
  label,
  value,
  emphasize,
}: {
  label: string
  value: string
  emphasize?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border px-4 py-4 shadow-sm',
        emphasize
          ? 'border-primary/25 bg-primary-soft/60 dark:bg-primary/15'
          : 'border-border bg-card',
      )}
    >
      <p className="text-overline">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold tracking-tight text-foreground tabular-nums">
        {value}
      </p>
    </div>
  )
}
