import { useEffect, useRef, useState } from 'react'
import { Copy, FileUp, Trash2, Unlink } from 'lucide-react'
import {
  RECEIPT_CATEGORIES,
  RECEIPT_CATEGORY_LABELS,
  SAMPLE_CURRENCIES,
  type ReceiptCategory,
  type SampleDayReceipt,
} from '@/features/destination-workspace/types/sample-day'
import { formatAud } from '@/shared/lib/format'
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
import { cn } from '@/shared/lib/cn'

export type ReceiptEvidenceOption = {
  id: string
  title: string
  fileName: string
}

type SampleDayReceiptCardProps = {
  receipt: SampleDayReceipt
  readOnly: boolean
  evidenceOptions: ReceiptEvidenceOption[]
  /** Focus amount field when this card is newly added */
  autoFocusAmount?: boolean
  /** Upload file into Evidence Vault for this destination and return the saved record */
  onUploadEvidence: (file: File) => Promise<ReceiptEvidenceOption>
  onChange: (patch: Partial<Omit<SampleDayReceipt, 'id'>>) => void
  onDuplicate: () => void
  onRemove: () => void
}

const EVIDENCE_ACCEPT =
  'image/*,application/pdf,.pdf,.png,.jpg,.jpeg,.webp,.heic,.gif,.doc,.docx,.csv,.txt'

function numberToDraft(value: number): string {
  return value === 0 ? '' : String(value)
}

/** Allow partial decimals like "12." while typing — Number("12.") would strip the point. */
function isDecimalDraft(value: string, maxFractionDigits?: number): boolean {
  if (value === '') return true
  if (maxFractionDigits == null) return /^\d*\.?\d*$/.test(value)
  return new RegExp(`^\\d*\\.?\\d{0,${maxFractionDigits}}$`).test(value)
}

function parseDecimalDraft(value: string): number {
  if (value === '' || value === '.') return 0
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

export function SampleDayReceiptCard({
  receipt,
  readOnly,
  evidenceOptions,
  autoFocusAmount,
  onUploadEvidence,
  onChange,
  onDuplicate,
  onRemove,
}: SampleDayReceiptCardProps) {
  const amountRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [amountDraft, setAmountDraft] = useState(() => numberToDraft(receipt.localAmount))
  const [rateDraft, setRateDraft] = useState(() => numberToDraft(receipt.exchangeRate))
  const [uploadPhase, setUploadPhase] = useState<UploadPhase>('idle')
  const [uploadFileName, setUploadFileName] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState(false)
  const pendingFileRef = useRef<File | null>(null)

  useEffect(() => {
    if (autoFocusAmount && !readOnly) {
      amountRef.current?.focus()
      amountRef.current?.select()
    }
  }, [autoFocusAmount, readOnly])

  useEffect(() => {
    setAmountDraft(numberToDraft(receipt.localAmount))
    setRateDraft(numberToDraft(receipt.exchangeRate))
  }, [receipt.id])

  const aud = formatAud(receipt.amountAud, 2)
  const linkedEvidence =
    receipt.evidenceId != null
      ? evidenceOptions.find((e) => e.id === receipt.evidenceId) ?? null
      : null

  const runUpload = async (file: File) => {
    pendingFileRef.current = file
    setUploadFileName(file.name)
    setUploadError(false)
    setUploadPhase('uploading')
    try {
      const saved = await onUploadEvidence(file)
      onChange({ evidenceId: saved.id })
      setUploadPhase('ready')
      pendingFileRef.current = null
    } catch {
      setUploadPhase('failed')
      setUploadError(true)
    }
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <header className="flex items-start justify-between gap-2 border-b border-border/70 bg-muted/30 px-4 py-3">
        <div className="min-w-0">
          <p className="text-overline">Receipt</p>
          <p className="truncate font-display text-base font-semibold text-foreground">
            {receipt.description.trim() || 'New receipt'}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {RECEIPT_CATEGORY_LABELS[receipt.category]} · {aud}
          </p>
        </div>
        {!readOnly ? (
          <div className="flex shrink-0 gap-1">
            <Button
              aria-label="Duplicate receipt"
              size="sm"
              variant="ghost"
              onClick={onDuplicate}
            >
              <Copy className="size-4" />
            </Button>
            <Button aria-label="Delete receipt" size="sm" variant="ghost" onClick={onRemove}>
              <Trash2 className="size-4" />
            </Button>
          </div>
        ) : null}
      </header>

      <div className="space-y-4 p-4">
        {/* Amount first — fastest mobile path */}
        <div className="space-y-2">
          <Label htmlFor={`amt-${receipt.id}`}>Amount</Label>
          <Input
            ref={amountRef}
            className="h-14 text-center font-display text-2xl font-semibold tabular-nums"
            disabled={readOnly}
            id={`amt-${receipt.id}`}
            inputMode="decimal"
            placeholder="0.00"
            value={amountDraft}
            onChange={(e) => {
              const next = e.target.value
              if (!isDecimalDraft(next, 2)) return
              setAmountDraft(next)
              onChange({ localAmount: parseDecimalDraft(next) })
            }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select
              disabled={readOnly}
              value={receipt.currencyCode}
              onValueChange={(currencyCode) =>
                onChange({
                  currencyCode,
                  exchangeRate: currencyCode === 'AUD' ? 1 : receipt.exchangeRate || 1,
                })
              }
            >
              <SelectTrigger aria-label="Currency" className="h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SAMPLE_CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`rate-${receipt.id}`}>
              {receipt.currencyCode === 'AUD' ? 'AUD value' : 'Exchange rate'}
            </Label>
            {receipt.currencyCode === 'AUD' ? (
              <div className="flex h-12 items-center rounded-sm border border-border bg-muted px-3 font-display text-lg font-semibold tabular-nums">
                {aud}
              </div>
            ) : (
              <Input
                className="h-12 tabular-nums"
                disabled={readOnly}
                id={`rate-${receipt.id}`}
                inputMode="decimal"
                placeholder="Units per A$1"
                value={rateDraft}
                onChange={(e) => {
                  const next = e.target.value
                  if (!isDecimalDraft(next, 6)) return
                  setRateDraft(next)
                  const n = parseDecimalDraft(next)
                  onChange({ exchangeRate: n > 0 ? n : 1 })
                }}
              />
            )}
          </div>
        </div>

        {receipt.currencyCode !== 'AUD' ? (
          <p className="rounded-xl bg-primary-soft/50 px-3 py-2 text-sm dark:bg-primary/15">
            AUD value:{' '}
            <span className="font-display font-semibold tabular-nums text-foreground">{aud}</span>
          </p>
        ) : null}

        <div className="space-y-2">
          <Label>Category</Label>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {RECEIPT_CATEGORIES.map((cat) => (
              <button
                key={cat}
                className={cn(
                  'shrink-0 rounded-full border px-3.5 py-2.5 text-sm font-semibold transition-colors touch-target',
                  receipt.category === cat
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border bg-background text-foreground',
                  readOnly && 'pointer-events-none opacity-70',
                )}
                disabled={readOnly}
                type="button"
                onClick={() => onChange({ category: cat as ReceiptCategory })}
              >
                {RECEIPT_CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor={`desc-${receipt.id}`}>Description</Label>
          <Input
            className="h-12"
            disabled={readOnly}
            id={`desc-${receipt.id}`}
            placeholder="e.g. Dinner near hotel"
            value={receipt.description}
            onChange={(e) => onChange({ description: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={`notes-${receipt.id}`}>Notes</Label>
          <Textarea
            className="min-h-[4.5rem]"
            disabled={readOnly}
            id={`notes-${receipt.id}`}
            placeholder="Optional"
            value={receipt.notes}
            onChange={(e) => onChange({ notes: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Evidence</Label>
          <p className="text-xs text-muted-foreground">
            Screenshot, photo, or PDF — saved to Evidence Vault for this destination and linked
            here.
          </p>

          {linkedEvidence && uploadPhase !== 'uploading' ? (
            <div className="flex items-start justify-between gap-3 rounded-xl border border-border bg-muted/30 px-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{linkedEvidence.title}</p>
                <p className="truncate text-xs text-muted-foreground">{linkedEvidence.fileName}</p>
              </div>
              {!readOnly ? (
                <Button
                  aria-label="Unlink evidence"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    onChange({ evidenceId: null })
                    setUploadPhase('idle')
                    setUploadFileName(null)
                  }}
                >
                  <Unlink className="size-4" />
                  Unlink
                </Button>
              ) : null}
            </div>
          ) : null}

          {uploadPhase === 'uploading' || uploadPhase === 'failed' ? (
            <UploadStatus
              fileName={uploadFileName ?? 'Evidence'}
              phase={uploadPhase}
              onRetry={
                uploadPhase === 'failed' && pendingFileRef.current
                  ? () => {
                      const file = pendingFileRef.current
                      if (file) void runUpload(file)
                    }
                  : undefined
              }
            />
          ) : null}

          {uploadError ? (
            <ErrorBanner
              code="UPLOAD_FAILED"
              onAction={() => {
                const file = pendingFileRef.current
                if (file) void runUpload(file)
              }}
            />
          ) : null}

          {!readOnly ? (
            <>
              <input
                ref={fileRef}
                accept={EVIDENCE_ACCEPT}
                className="sr-only"
                type="file"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  e.target.value = ''
                  if (file) void runUpload(file)
                }}
              />
              <Button
                className="min-h-12 w-full"
                disabled={uploadPhase === 'uploading'}
                type="button"
                variant="outline"
                onClick={() => fileRef.current?.click()}
              >
                <FileUp className="size-4" />
                {linkedEvidence ? 'Replace evidence' : 'Upload evidence'}
              </Button>
            </>
          ) : !linkedEvidence ? (
            <p className="text-sm text-muted-foreground">No evidence linked</p>
          ) : null}
        </div>
      </div>
    </article>
  )
}
