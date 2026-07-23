import { useEffect, useRef, useState } from 'react'
import {
  EVIDENCE_CATEGORIES,
  EVIDENCE_CATEGORY_LABELS,
  type EvidenceCategory,
  type EvidenceClaimOption,
  type EvidenceDestinationOption,
  type EvidenceUploadInput,
} from '@/features/evidence/types/evidence'
import { parseTagsInput } from '@/features/evidence/utils/normalize-evidence'
import { localDateYmd, monthKeyFromDate } from '@/features/evidence/utils/normalize-evidence'
import { monthShortLabel } from '@/features/overnight-planner/utils/fy-months'
import { fyMonthKeys } from '@/features/overnight-planner/utils/fy-months'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { UploadStatus, type UploadPhase } from '@/shared/components/ui/upload-status'
import { ErrorBanner } from '@/shared/components/ui/error-banner'

type EvidenceUploadDialogProps = {
  open: boolean
  fyEndYear: number
  claimOptions: EvidenceClaimOption[]
  destinationOptions: EvidenceDestinationOption[]
  /** Prefill destination when opened from Destination Workspace */
  defaultDestinationId?: string | null
  /** Prefill linked claim when opened from claims-without-evidence */
  defaultLinkedClaimId?: string | null
  onOpenChange: (open: boolean) => void
  onUpload: (input: EvidenceUploadInput) => Promise<unknown>
}

export function EvidenceUploadDialog({
  open,
  fyEndYear,
  claimOptions,
  destinationOptions,
  defaultDestinationId = null,
  defaultLinkedClaimId = null,
  onOpenChange,
  onUpload,
}: EvidenceUploadDialogProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [category, setCategory] = useState<EvidenceCategory>('receipt')
  const [documentDate, setDocumentDate] = useState(() => localDateYmd())
  const [monthKey, setMonthKey] = useState<string>('auto')
  const [description, setDescription] = useState('')
  const [tagsText, setTagsText] = useState('')
  const [linkedClaimId, setLinkedClaimId] = useState('none')
  const [destinationId, setDestinationId] = useState('none')
  const [phase, setPhase] = useState<UploadPhase>('idle')
  const [error, setError] = useState(false)
  const months = fyMonthKeys(fyEndYear)

  useEffect(() => {
    if (open && defaultDestinationId) {
      setDestinationId(defaultDestinationId)
    }
  }, [open, defaultDestinationId])

  useEffect(() => {
    if (open) {
      setDocumentDate(localDateYmd())
      setLinkedClaimId(defaultLinkedClaimId ?? 'none')
    }
  }, [open, defaultLinkedClaimId])

  const reset = () => {
    setFile(null)
    setCategory('receipt')
    setDocumentDate(localDateYmd())
    setMonthKey('auto')
    setDescription('')
    setTagsText('')
    setLinkedClaimId(defaultLinkedClaimId ?? 'none')
    setDestinationId(defaultDestinationId ?? 'none')
    setPhase('idle')
    setError(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const submit = async () => {
    if (!file) return
    setError(false)
    setPhase('uploading')
    try {
      const claim =
        linkedClaimId === 'none'
          ? null
          : (claimOptions.find((c) => c.id === linkedClaimId) ?? null)
      const dest =
        destinationId === 'none'
          ? null
          : (destinationOptions.find((d) => d.id === destinationId) ?? null)
      const resolvedMonth =
        monthKey === 'auto'
          ? monthKeyFromDate(documentDate || null)
          : monthKey
      await onUpload({
        file,
        category,
        fyEndYear,
        documentDate: documentDate || null,
        monthKey: resolvedMonth,
        description,
        tags: parseTagsInput(tagsText),
        linkedClaimId: claim?.id ?? null,
        linkedClaimLabel: claim?.label ?? null,
        destinationId: dest?.id ?? null,
        destinationName: dest?.name ?? null,
      })
      setPhase('ready')
      reset()
      onOpenChange(false)
    } catch {
      setPhase('failed')
      setError(true)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset()
        onOpenChange(next)
      }}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload evidence</DialogTitle>
          <DialogDescription>
            PDF, images, screenshots, payslips, rosters, travel documents, or receipts. Stored only —
            not analysed or used in calculations.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <ErrorBanner
            code="UPLOAD_FAILED"
            onAction={() => {
              setError(false)
              setPhase('idle')
              void submit()
            }}
          />
        ) : null}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>File</Label>
            <input
              ref={fileRef}
              accept="image/*,application/pdf,.pdf,.png,.jpg,.jpeg,.webp,.heic,.gif"
              className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-primary-soft file:px-3 file:py-2 file:text-sm file:font-semibold file:text-accent-foreground"
              type="file"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null)
                setPhase('idle')
                setError(false)
              }}
            />
            {file ? (
              <UploadStatus
                fileName={file.name}
                phase={phase === 'idle' ? 'ready' : phase}
                onRetry={
                  phase === 'failed'
                    ? () => {
                        setError(false)
                        setPhase('idle')
                        void submit()
                      }
                    : undefined
                }
              />
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Document type</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as EvidenceCategory)}>
              <SelectTrigger aria-label="Document type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVIDENCE_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {EVIDENCE_CATEGORY_LABELS[c]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="doc-date">Document date</Label>
              <Input
                id="doc-date"
                type="date"
                value={documentDate}
                onChange={(e) => setDocumentDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Month</Label>
              <Select value={monthKey} onValueChange={setMonthKey}>
                <SelectTrigger aria-label="Month">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">From document date</SelectItem>
                  {months.map((m) => (
                    <SelectItem key={m} value={m}>
                      {monthShortLabel(m)} {m.slice(0, 4)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Destination (optional)</Label>
            <Select value={destinationId} onValueChange={setDestinationId}>
              <SelectTrigger aria-label="Destination">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No destination</SelectItem>
                {destinationOptions.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              placeholder="Optional notes for you or your accountant"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              placeholder="e.g. layover, meals, uniform"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Comma-separated</p>
          </div>

          <div className="space-y-2">
            <Label>Linked claim (optional)</Label>
            <Select value={linkedClaimId} onValueChange={setLinkedClaimId}>
              <SelectTrigger aria-label="Linked claim">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not linked</SelectItem>
                {claimOptions.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!file || phase === 'uploading'} onClick={() => void submit()}>
            Upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
