import { useCallback, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useFy } from '@/app/providers/fy-provider'
import { EvidenceUploadDialog } from '@/features/evidence/components/evidence-upload-dialog'
import { useEvidenceVault } from '@/features/evidence/hooks/use-evidence-vault'
import {
  dismissClaimGap,
  restoreClaimGap,
} from '@/features/evidence/services/dismissed-claim-gaps'
import {
  listUnlinkedClaims,
  type ClaimEvidenceRow,
} from '@/features/evidence/utils/claim-evidence-status'
import { EmptyState } from '@/shared/components/ajx/empty-state'
import { PageHeader } from '@/shared/components/ajx/page-header'
import { SoftBanner } from '@/shared/components/ajx/soft-banner'
import { TableSkeleton } from '@/shared/components/ajx/loading-states'
import { Button } from '@/shared/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/components/ui/table'
import { useUndoToast } from '@/shared/components/ui/undo-toast'
import { formatAud, formatDateYmd } from '@/shared/lib/format'

export function ClaimsWithoutEvidencePage() {
  const { fyEndYear, label } = useFy()
  const navigate = useNavigate()
  const vault = useEvidenceVault()
  const { showUndo } = useUndoToast()
  const [tick, setTick] = useState(0)
  const [uploadClaim, setUploadClaim] = useState<ClaimEvidenceRow | null>(null)

  const refresh = useCallback(() => setTick((t) => t + 1), [])

  const rows = useMemo(() => {
    void tick
    void vault.claimOptions
    return listUnlinkedClaims(fyEndYear)
  }, [fyEndYear, tick, vault.claimOptions])

  const dismiss = (row: ClaimEvidenceRow) => {
    dismissClaimGap(fyEndYear, row.id)
    refresh()
    showUndo({
      message: 'Claim dismissed from this list.',
      onUndo: () => {
        restoreClaimGap(fyEndYear, row.id)
        refresh()
      },
    })
  }

  if (vault.loading) {
    return <TableSkeleton rows={6} />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        actions={
          <Button asChild variant="outline">
            <Link to="/">Come back later</Link>
          </Button>
        }
        description={`${label} · Review claims with no linked receipt or document. Dismiss if you do not need one yet.`}
        title="Claims without evidence"
      />

      <SoftBanner tone="info">
        Linking evidence strengthens your working papers. Dismissing hides a claim from Home until you
        restore it — the claim itself stays in your Tax Position.
      </SoftBanner>

      {rows.length === 0 ? (
        <EmptyState
          actionLabel="Back to Home"
          description="Every claim either has linked evidence or has been dismissed for now."
          title="Nothing left to review"
          onAction={() => navigate('/')}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {formatDateYmd(row.dateYmd) ?? '—'}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{row.category}</TableCell>
                  <TableCell>
                    <div className="min-w-[12rem]">
                      <p className="font-medium text-foreground">{row.description}</p>
                      {row.currencyNote ? (
                        <p className="text-xs text-muted-foreground">{row.currencyNote}</p>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right tabular-nums">
                    {formatAud(row.amountAud, 0)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Button size="sm" onClick={() => setUploadClaim(row)}>
                        Add evidence
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => dismiss(row)}>
                        Dismiss
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <EvidenceUploadDialog
        claimOptions={vault.claimOptions}
        defaultLinkedClaimId={uploadClaim?.id ?? null}
        destinationOptions={vault.destinationOptions}
        fyEndYear={fyEndYear}
        open={uploadClaim != null}
        onOpenChange={(open) => {
          if (!open) setUploadClaim(null)
        }}
        onUpload={async (input) => {
          await vault.upload(input)
          refresh()
        }}
      />
    </div>
  )
}
