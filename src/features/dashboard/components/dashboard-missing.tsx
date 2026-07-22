import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { MissingItem } from '@/features/dashboard/types/snapshot'
import { AppCard } from '@/shared/components/ajx/app-card'
import { SectionHeader } from '@/shared/components/ajx/section-header'
import { Badge } from '@/shared/components/ui/badge'

type DashboardMissingProps = {
  items: MissingItem[]
}

export function DashboardMissing({ items }: DashboardMissingProps) {
  if (items.length === 0) {
    return (
      <AppCard
        header={
          <SectionHeader
            description="Nothing urgent for this year"
            title="Missing evidence"
          />
        }
      >
        <p className="text-sm text-muted-foreground">
          Your position looks supported for now. Keep capturing as you go.
        </p>
      </AppCard>
    )
  }

  return (
    <AppCard
      header={
        <SectionHeader
          description="Gaps that reduce confidence in your working papers"
          title="Missing evidence"
        />
      }
    >
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              className="flex items-start gap-3 rounded-lg border border-border bg-background/60 px-3 py-3 transition-colors hover:bg-muted/50"
              to={item.href}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                  {item.count != null ? (
                    <Badge variant="warning">{item.count}</Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
              <ChevronRight aria-hidden className="mt-1 size-4 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </AppCard>
  )
}
