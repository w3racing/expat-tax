import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useEvidenceVault } from '@/features/evidence/hooks/use-evidence-vault'
import { EvidenceUploadDialog } from '@/features/evidence/components/evidence-upload-dialog'
import { EvidenceList } from '@/features/evidence/components/evidence-list'
import { EvidencePreview } from '@/features/evidence/components/evidence-preview'
import {
  EVIDENCE_CATEGORIES,
  EVIDENCE_CATEGORY_LABELS,
  type EvidenceCategory,
} from '@/features/evidence/types/evidence'
import { monthShortLabel } from '@/features/overnight-planner/utils/fy-months'
import { PageHeader } from '@/shared/components/ajx/page-header'
import { EmptyState } from '@/shared/components/ajx/empty-state'
import { EvidenceEmptyIllustration } from '@/shared/components/ajx/illustrations'
import { SearchField } from '@/shared/components/ajx/search-field'
import { FilterChip } from '@/shared/components/ajx/filter-chip'
import { SoftBanner } from '@/shared/components/ajx/soft-banner'
import { Button } from '@/shared/components/ui/button'
import { ConfirmDialog } from '@/shared/components/ui/confirm-dialog'
import { ListSkeleton } from '@/shared/components/ajx/loading-states'
import { useUndoToast } from '@/shared/components/ui/undo-toast'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet'
import { isSupabaseConfigured } from '@/shared/lib/supabase'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { Label } from '@/shared/components/ui/label'

export function EvidencePage() {
  const vault = useEvidenceVault()
  const { showUndo } = useUndoToast()
  const [searchParams] = useSearchParams()
  const [uploadOpen, setUploadOpen] = useState(false)
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null)
  const [isNarrow, setIsNarrow] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 1023px)').matches : false,
  )

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 1023px)')
    const onChange = () => setIsNarrow(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    const dest = searchParams.get('destination')
    if (!dest) return
    vault.setDestinationId(dest)
    setUploadOpen(true)
    // Apply once when landing with ?destination=
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const preview = vault.selected ? (
    <EvidencePreview
      claimOptions={vault.claimOptions}
      destinationOptions={vault.destinationOptions}
      record={vault.selected}
      onClose={() => vault.setSelectedId(null)}
      onDelete={(id) => setPendingDeleteId(id)}
      onReplace={vault.replace}
      onUpdate={vault.update}
    />
  ) : null

  return (
    <div className="space-y-6">
      <PageHeader
        actions={<Button onClick={() => setUploadOpen(true)}>Upload</Button>}
        description={`${vault.label} · Supporting evidence only — not used for calculations.`}
        title="Evidence Vault"
      />

      <SoftBanner tone="info">
        {isSupabaseConfigured
          ? 'Document storage only. Files go to private cloud storage. No OCR, roster interpretation, or AI analysis in MVP.'
          : 'Document storage only. Files up to 4 MB stay in this browser until Supabase is configured. No OCR or analysis.'}
      </SoftBanner>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <SearchField
          aria-label="Search evidence"
          className="flex-1"
          placeholder="Search filename, description, tags, destination…"
          value={vault.query}
          onChange={(e) => vault.setQuery(e.target.value)}
        />
        <div className="grid w-full gap-3 sm:w-auto sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Month</Label>
            <Select
              value={vault.monthKey}
              onValueChange={(v) => vault.setMonthKey(v as string | 'all')}
            >
              <SelectTrigger aria-label="Filter by month" className="min-w-[9rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All months</SelectItem>
                {vault.monthOptions.map((m) => (
                  <SelectItem key={m} value={m}>
                    {monthShortLabel(m)} {m.slice(0, 4)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Destination</Label>
            <Select
              value={vault.destinationId}
              onValueChange={(v) => vault.setDestinationId(v as string | 'all')}
            >
              <SelectTrigger aria-label="Filter by destination" className="min-w-[9rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All destinations</SelectItem>
                {vault.destinationOptions.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {vault.tagOptions.length > 0 ? (
            <div className="space-y-1.5">
              <Label className="text-xs">Tag</Label>
              <Select
                value={vault.tag}
                onValueChange={(v) => vault.setTag(v as string | 'all')}
              >
                <SelectTrigger aria-label="Filter by tag" className="min-w-[9rem]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tags</SelectItem>
                  {vault.tagOptions.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <FilterChip
          label="All types"
          selected={vault.category === 'all'}
          onToggle={() => vault.setCategory('all')}
        />
        {EVIDENCE_CATEGORIES.map((c) => (
          <FilterChip
            key={c}
            label={EVIDENCE_CATEGORY_LABELS[c]}
            selected={vault.category === c}
            onToggle={() =>
              vault.setCategory((prev) => (prev === c ? 'all' : (c as EvidenceCategory)))
            }
          />
        ))}
      </div>

      {vault.loading ? (
        <ListSkeleton rows={4} />
      ) : vault.allCount === 0 ? (
        <EmptyState
          actionLabel="Upload a document"
          description="Add PDFs, images, screenshots, payslips, rosters, travel documents, and receipts. Organised by financial year, month, type, and optional destination."
          illustration={<EvidenceEmptyIllustration />}
          title="Evidence Vault is empty"
          onAction={() => setUploadOpen(true)}
        />
      ) : vault.items.length === 0 ? (
        <EmptyState
          actionLabel="Clear filters"
          description="Nothing matches this search or filter combination."
          title="No matches"
          onAction={vault.clearFilters}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <EvidenceList
            items={vault.items}
            selectedId={vault.selected?.id ?? null}
            onSelect={vault.setSelectedId}
          />
          <div className="hidden lg:block">
            {preview ?? (
              <div className="flex items-center justify-center rounded-2xl border border-dashed border-border p-8 text-sm text-muted-foreground">
                Select a document to preview, rename, replace, or download.
              </div>
            )}
          </div>
        </div>
      )}

      <Sheet
        open={isNarrow && Boolean(vault.selected) && vault.items.length > 0}
        onOpenChange={(open) => {
          if (!open) vault.setSelectedId(null)
        }}
      >
        <SheetContent className="overflow-y-auto" side="bottom">
          <SheetHeader>
            <SheetTitle>Document details</SheetTitle>
          </SheetHeader>
          {preview}
        </SheetContent>
      </Sheet>

      <EvidenceUploadDialog
        claimOptions={vault.claimOptions}
        defaultDestinationId={
          vault.destinationId !== 'all' ? vault.destinationId : searchParams.get('destination')
        }
        destinationOptions={vault.destinationOptions}
        fyEndYear={vault.fyEndYear}
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUpload={vault.upload}
      />

      <ConfirmDialog
        confirmLabel="Delete"
        description="This removes the file from your vault. You can undo immediately after."
        destructive
        open={pendingDeleteId != null}
        title="Delete evidence?"
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          if (!pendingDeleteId) return
          const id = pendingDeleteId
          vault.remove(id)
          setPendingDeleteId(null)
          showUndo({
            message: 'Evidence deleted',
            onUndo: () => vault.restore(id),
          })
        }}
      />
    </div>
  )
}
