import { FileText, Image as ImageIcon } from 'lucide-react'
import type { EvidenceRecord } from '@/features/evidence/types/evidence'
import { categoryLabel } from '@/features/evidence/types/evidence'
import { monthShortLabel } from '@/features/overnight-planner/utils/fy-months'
import { EvidenceListItem } from '@/shared/components/ajx/evidence-list-item'

type EvidenceListProps = {
  items: EvidenceRecord[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function EvidenceList({ items, selectedId, onSelect }: EvidenceListProps) {
  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const status =
          item.processingStatus === 'ready'
            ? 'ready'
            : item.processingStatus === 'failed'
              ? 'failed'
              : 'processing'
        const leading = item.mimeType.startsWith('image/') ? (
          <ImageIcon className="size-5" />
        ) : (
          <FileText className="size-5" />
        )
        const monthBit = item.monthKey
          ? `${monthShortLabel(item.monthKey)} ${item.monthKey.slice(0, 4)}`
          : 'No month'
        const parts = [
          categoryLabel(item.category),
          monthBit,
          item.destinationName,
          item.linkedClaimLabel,
          item.tags.length ? item.tags.slice(0, 2).join(', ') : null,
        ].filter(Boolean)
        return (
          <li key={item.id}>
            <EvidenceListItem
              className={selectedId === item.id ? 'ring-2 ring-ring' : undefined}
              leading={leading}
              meta={parts.join(' · ')}
              status={status}
              title={item.title}
              onClick={() => onSelect(item.id)}
            />
          </li>
        )
      })}
    </ul>
  )
}
