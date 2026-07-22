import { useEffect, useRef, useState } from 'react'
import { Download, Link2, Replace, Trash2 } from 'lucide-react'
import type {
  EvidenceRecord,
  EvidenceClaimOption,
  EvidenceCategory,
  EvidenceDestinationOption,
  EvidenceMetadataPatch,
} from '@/features/evidence/types/evidence'
import {
  EVIDENCE_CATEGORIES,
  EVIDENCE_CATEGORY_LABELS,
  categoryLabel,
  storageLocationLabel,
} from '@/features/evidence/types/evidence'
import {
  downloadEvidenceFile,
  getEvidenceDownloadUrl,
} from '@/features/evidence/services/evidence-vault'
import {
  formatTagsInput,
  parseTagsInput,
} from '@/features/evidence/utils/normalize-evidence'
import { fyMonthKeys, monthShortLabel } from '@/features/overnight-planner/utils/fy-months'
import { AppCard } from '@/shared/components/ajx/app-card'
import { SectionHeader } from '@/shared/components/ajx/section-header'
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
import { SoftBanner } from '@/shared/components/ajx/soft-banner'
import { ErrorBanner } from '@/shared/components/ui/error-banner'
import { UploadStatus, type UploadPhase } from '@/shared/components/ui/upload-status'

type EvidencePreviewProps = {
  record: EvidenceRecord
  claimOptions: EvidenceClaimOption[]
  destinationOptions: EvidenceDestinationOption[]
  onUpdate: (id: string, patch: EvidenceMetadataPatch) => void
  onReplace: (id: string, file: File) => Promise<unknown>
  onDelete: (id: string) => void
  onClose: () => void
}

export function EvidencePreview({
  record,
  claimOptions,
  destinationOptions,
  onUpdate,
  onReplace,
  onDelete,
  onClose,
}: EvidencePreviewProps) {
  const replaceRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [downloadError, setDownloadError] = useState(false)
  const [replacePhase, setReplacePhase] = useState<UploadPhase>('idle')
  const [replaceError, setReplaceError] = useState(false)
  const [tagsText, setTagsText] = useState(formatTagsInput(record.tags))
  const months = fyMonthKeys(record.fyEndYear)

  useEffect(() => {
    setTagsText(formatTagsInput(record.tags))
  }, [record.id, record.tags])

  useEffect(() => {
    let cancelled = false
    void getEvidenceDownloadUrl(record).then((url) => {
      if (!cancelled) setPreviewUrl(url)
    })
    return () => {
      cancelled = true
    }
  }, [record])

  const isImage = record.mimeType.startsWith('image/')
  const isPdf = record.mimeType === 'application/pdf'

  const commitTags = () => {
    const tags = parseTagsInput(tagsText)
    onUpdate(record.id, { tags })
    setTagsText(formatTagsInput(tags))
  }

  const handleReplace = async (file: File | undefined) => {
    if (!file) return
    setReplaceError(false)
    setReplacePhase('uploading')
    try {
      await onReplace(record.id, file)
      setReplacePhase('ready')
    } catch {
      setReplacePhase('failed')
      setReplaceError(true)
    }
  }

  return (
    <AppCard className="space-y-4">
      <SectionHeader
        action={
          <Button size="sm" variant="ghost" onClick={onClose}>
            Close
          </Button>
        }
        description={`${categoryLabel(record.category)} · FY ${record.fyEndYear - 1}–${String(record.fyEndYear).slice(2)}`}
        title={record.title}
      />

      <div className="overflow-hidden rounded-xl border border-border bg-muted/40">
        {previewUrl && isImage ? (
          <img
            alt={record.title}
            className="mx-auto max-h-72 w-full object-contain"
            src={previewUrl}
          />
        ) : previewUrl && isPdf ? (
          <iframe className="h-72 w-full" sandbox="" src={previewUrl} title={record.fileName} />
        ) : (
          <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
            Preview unavailable — download the file instead.
          </div>
        )}
      </div>

      {downloadError ? <ErrorBanner code="NOT_FOUND" /> : null}
      {replaceError ? (
        <ErrorBanner
          code="UPLOAD_FAILED"
          onAction={() => {
            setReplaceError(false)
            setReplacePhase('idle')
            replaceRef.current?.click()
          }}
        />
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="soft"
          onClick={() => {
            setDownloadError(false)
            void downloadEvidenceFile(record).catch(() => setDownloadError(true))
          }}
        >
          <Download className="size-4" />
          Download
        </Button>
        <Button size="sm" variant="outline" onClick={() => replaceRef.current?.click()}>
          <Replace className="size-4" />
          Replace
        </Button>
        <input
          ref={replaceRef}
          accept="image/*,application/pdf,.pdf,.png,.jpg,.jpeg,.webp,.heic,.gif"
          className="hidden"
          type="file"
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            void handleReplace(file)
          }}
        />
        <Button size="sm" variant="destructive" onClick={() => onDelete(record.id)}>
          <Trash2 className="size-4" />
          Delete
        </Button>
      </div>

      {replacePhase === 'uploading' || replacePhase === 'failed' || replacePhase === 'ready' ? (
        <UploadStatus fileName={record.fileName} phase={replacePhase} />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="ev-title">Title</Label>
          <Input
            id="ev-title"
            value={record.title}
            onChange={(e) => onUpdate(record.id, { title: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ev-filename">Filename</Label>
          <Input
            id="ev-filename"
            value={record.fileName}
            onChange={(e) => onUpdate(record.id, { fileName: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ev-category">Document type</Label>
          <Select
            value={record.category}
            onValueChange={(v) => onUpdate(record.id, { category: v as EvidenceCategory })}
          >
            <SelectTrigger aria-label="Document type" id="ev-category">
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
        <div className="space-y-2">
          <Label htmlFor="ev-date">Document date</Label>
          <Input
            id="ev-date"
            type="date"
            value={record.documentDate ?? ''}
            onChange={(e) => onUpdate(record.id, { documentDate: e.target.value || null })}
          />
        </div>
        <div className="space-y-2">
          <Label>Month</Label>
          <Select
            value={record.monthKey ?? 'none'}
            onValueChange={(v) =>
              onUpdate(record.id, { monthKey: v === 'none' ? null : v })
            }
          >
            <SelectTrigger aria-label="Month">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Unassigned</SelectItem>
              {months.map((m) => (
                <SelectItem key={m} value={m}>
                  {monthShortLabel(m)} {m.slice(0, 4)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Destination</Label>
          <Select
            value={record.destinationId ?? 'none'}
            onValueChange={(v) => {
              if (v === 'none') {
                onUpdate(record.id, { destinationId: null, destinationName: null })
                return
              }
              const dest = destinationOptions.find((d) => d.id === v)
              onUpdate(record.id, {
                destinationId: v,
                destinationName: dest?.name ?? null,
              })
            }}
          >
            <SelectTrigger aria-label="Destination">
              <SelectValue />
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
          <Label htmlFor="ev-claim">Linked claim</Label>
          <Select
            value={record.linkedClaimId ?? 'none'}
            onValueChange={(v) => {
              if (v === 'none') {
                onUpdate(record.id, { linkedClaimId: null, linkedClaimLabel: null })
                return
              }
              const claim = claimOptions.find((c) => c.id === v)
              onUpdate(record.id, {
                linkedClaimId: v,
                linkedClaimLabel: claim?.label ?? null,
              })
            }}
          >
            <SelectTrigger aria-label="Linked claim" id="ev-claim">
              <SelectValue />
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
        <div className="space-y-2">
          <Label htmlFor="ev-tags">Tags</Label>
          <Input
            id="ev-tags"
            value={tagsText}
            onBlur={commitTags}
            onChange={(e) => setTagsText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                commitTags()
              }
            }}
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="ev-desc">Description</Label>
          <Textarea
            id="ev-desc"
            value={record.description}
            onChange={(e) => onUpdate(record.id, { description: e.target.value })}
          />
        </div>
      </div>

      <dl className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
        <div>
          <dt className="text-overline">Upload date</dt>
          <dd className="mt-0.5 text-foreground">
            {new Date(record.createdAt).toLocaleString('en-AU')}
          </dd>
        </div>
        <div>
          <dt className="text-overline">Storage location</dt>
          <dd className="mt-0.5 break-all text-foreground">{storageLocationLabel(record)}</dd>
        </div>
        {record.destinationName ? (
          <div>
            <dt className="text-overline">Destination</dt>
            <dd className="mt-0.5 text-foreground">{record.destinationName}</dd>
          </div>
        ) : null}
        {record.linkedClaimLabel ? (
          <div className="flex items-start gap-1.5">
            <Link2 aria-hidden className="mt-0.5 size-3.5" />
            <div>
              <dt className="text-overline">Claim</dt>
              <dd className="mt-0.5 text-foreground">{record.linkedClaimLabel}</dd>
            </div>
          </div>
        ) : null}
      </dl>

      <SoftBanner tone="info">
        Supporting evidence only — documents are not analysed, OCR’d, or used in overnight
        calculations during MVP.
      </SoftBanner>
    </AppCard>
  )
}
