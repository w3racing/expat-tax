import { useEffect, useRef, useState } from 'react'
import { Camera, Copy, ImagePlus, Trash2, X } from 'lucide-react'
import {
  RECEIPT_CATEGORIES,
  RECEIPT_CATEGORY_LABELS,
  SAMPLE_CURRENCIES,
  type ReceiptCategory,
  type SampleDayReceipt,
} from '@/features/destination-workspace/types/sample-day'
import { readReceiptImageAsDataUrl } from '@/features/destination-workspace/services/sample-day-store'
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
import { cn } from '@/shared/lib/cn'

type SampleDayReceiptCardProps = {
  receipt: SampleDayReceipt
  readOnly: boolean
  /** Focus amount field when this card is newly added */
  autoFocusAmount?: boolean
  onChange: (patch: Partial<Omit<SampleDayReceipt, 'id'>>) => void
  onDuplicate: () => void
  onRemove: () => void
}

export function SampleDayReceiptCard({
  receipt,
  readOnly,
  autoFocusAmount,
  onChange,
  onDuplicate,
  onRemove,
}: SampleDayReceiptCardProps) {
  const amountRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [imageError, setImageError] = useState<string | null>(null)

  useEffect(() => {
    if (autoFocusAmount && !readOnly) {
      amountRef.current?.focus()
      amountRef.current?.select()
    }
  }, [autoFocusAmount, readOnly])

  const aud = formatAud(receipt.amountAud, 2)

  const attachImage = async (file: File | undefined) => {
    if (!file) return
    setImageError(null)
    try {
      const { dataUrl, fileName } = await readReceiptImageAsDataUrl(file)
      onChange({ imageDataUrl: dataUrl, imageFileName: fileName })
    } catch (err) {
      setImageError(err instanceof Error ? err.message : 'Could not attach photo')
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
            value={receipt.localAmount === 0 ? '' : String(receipt.localAmount)}
            onChange={(e) => {
              const n = Number(e.target.value)
              onChange({ localAmount: Number.isFinite(n) ? n : 0 })
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
                value={receipt.exchangeRate === 0 ? '' : String(receipt.exchangeRate)}
                onChange={(e) => {
                  const n = Number(e.target.value)
                  onChange({ exchangeRate: Number.isFinite(n) && n > 0 ? n : 1 })
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
          <Label>Photo</Label>
          {receipt.imageDataUrl ? (
            <div className="relative overflow-hidden rounded-xl border border-border">
              <img
                alt={receipt.imageFileName ?? 'Receipt photo'}
                className="max-h-48 w-full object-cover"
                src={receipt.imageDataUrl}
              />
              {!readOnly ? (
                <Button
                  className="absolute top-2 right-2"
                  size="sm"
                  variant="secondary"
                  onClick={() => onChange({ imageDataUrl: null, imageFileName: null })}
                >
                  <X className="size-4" />
                  Remove
                </Button>
              ) : null}
            </div>
          ) : !readOnly ? (
            <div className="flex flex-wrap gap-2">
              <Button
                className="min-h-12 flex-1"
                type="button"
                variant="outline"
                onClick={() => cameraRef.current?.click()}
              >
                <Camera className="size-4" />
                Take photo
              </Button>
              <label className="inline-flex min-h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-semibold">
                <ImagePlus className="size-4" />
                Choose image
                <input
                  accept="image/*"
                  className="sr-only"
                  type="file"
                  onChange={(e) => {
                    void attachImage(e.target.files?.[0])
                    e.target.value = ''
                  }}
                />
              </label>
              <input
                ref={cameraRef}
                accept="image/*"
                capture="environment"
                className="sr-only"
                type="file"
                onChange={(e) => {
                  void attachImage(e.target.files?.[0])
                  e.target.value = ''
                }}
              />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No photo attached</p>
          )}
          {imageError ? <p className="text-sm text-destructive">{imageError}</p> : null}
        </div>
      </div>
    </article>
  )
}
