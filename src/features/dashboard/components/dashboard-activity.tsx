import { Link } from 'react-router-dom'
import { CalendarDays, FileText } from 'lucide-react'
import type { ReactNode } from 'react'
import type { ActivityItem } from '@/features/dashboard/types/snapshot'
import { AppCard } from '@/shared/components/ajx/app-card'
import { SectionHeader } from '@/shared/components/ajx/section-header'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { cn } from '@/shared/lib/cn'

type DashboardRecentUploadsProps = {
  items: ActivityItem[]
}

export function DashboardRecentUploads({ items }: DashboardRecentUploadsProps) {
  return (
    <AppCard
      header={
        <SectionHeader
          action={
            <Button asChild size="sm" variant="ghost">
              <Link to="/evidence">See all</Link>
            </Button>
          }
          description="Latest documents in this financial year"
          title="Recent uploads"
        />
      }
    >
      {items.length === 0 ? (
        <EmptyRail
          actionHref="/evidence"
          actionLabel="Upload evidence"
          message="Receipts and supporting documents will appear here."
        />
      ) : (
        <ul className="space-y-1">
          {items.map((item) => (
            <ActivityRow key={item.id} icon={<FileText className="size-4" />} item={item} />
          ))}
        </ul>
      )}
    </AppCard>
  )
}

type DashboardRecentSampleDaysProps = {
  items: ActivityItem[]
}

export function DashboardRecentSampleDays({ items }: DashboardRecentSampleDaysProps) {
  return (
    <AppCard
      header={
        <SectionHeader
          action={
            <Button asChild size="sm" variant="ghost">
              <Link to="/overnight">Overnight</Link>
            </Button>
          }
          description="Sample days that feed destination averages"
          title="Recent sample days"
        />
      }
    >
      {items.length === 0 ? (
        <EmptyRail
          actionHref="/overnight"
          actionLabel="Open overnight planner"
          message="Completed sample days update your average daily spend and claim."
        />
      ) : (
        <ul className="space-y-1">
          {items.map((item) => (
            <ActivityRow
              key={item.id}
              icon={<CalendarDays className="size-4" />}
              item={item}
              tone={item.statusLabel === 'Complete' ? 'success' : 'muted'}
            />
          ))}
        </ul>
      )}
    </AppCard>
  )
}

/** @deprecated Prefer DashboardRecentUploads */
export function DashboardActivity({ items }: { items: ActivityItem[] }) {
  return <DashboardRecentUploads items={items} />
}

function ActivityRow({
  item,
  icon,
  tone = 'muted',
}: {
  item: ActivityItem
  icon: ReactNode
  tone?: 'muted' | 'success'
}) {
  return (
    <li>
      <Link
        className="flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        to={item.href}
      >
        <div
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-xl',
            tone === 'success' ? 'bg-success-soft text-success' : 'bg-accent text-primary',
          )}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{item.title}</p>
          <p className="truncate text-xs text-muted-foreground">{item.meta}</p>
        </div>
        {item.statusLabel ? (
          <Badge
            className="shrink-0"
            variant={item.statusLabel === 'Complete' || item.statusLabel === 'Ready' ? 'success' : 'default'}
          >
            {item.statusLabel}
          </Badge>
        ) : null}
      </Link>
    </li>
  )
}

function EmptyRail({
  message,
  actionHref,
  actionLabel,
}: {
  message: string
  actionHref: string
  actionLabel: string
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button asChild className="mt-3" size="sm" variant="outline">
        <Link to={actionHref}>{actionLabel}</Link>
      </Button>
    </div>
  )
}
