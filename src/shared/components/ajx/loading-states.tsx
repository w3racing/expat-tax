import type { HTMLAttributes } from 'react'
import { Skeleton } from '@/shared/components/ui/skeleton'
import { cn } from '@/shared/lib/cn'

/** Layout-matched loading for a dashboard metric card. */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading"
      className={cn('rounded-lg border border-border bg-card p-4 shadow-sm md:p-5', className)}
      role="status"
    >
      <Skeleton className="h-3 w-24" />
      <Skeleton className="mt-3 h-8 w-36" />
      <Skeleton className="mt-2 h-3 w-40" />
    </div>
  )
}

/** Page header + card grid skeleton for dashboard-style screens. */
export function PageSkeleton({
  cards = 3,
  className,
}: {
  cards?: number
  className?: string
}) {
  return (
    <div aria-busy="true" aria-label="Loading page" className={cn('space-y-6', className)} role="status">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: cards }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  )
}

/** Compact list row skeletons (evidence / activity). */
export function ListSkeleton({
  rows = 4,
  className,
}: {
  rows?: number
  className?: string
}) {
  return (
    <div aria-busy="true" aria-label="Loading list" className={cn('space-y-2', className)} role="status">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
        >
          <Skeleton className="size-12 shrink-0 rounded-md" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-48 max-w-[66%]" />
            <Skeleton className="h-3 w-32" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function TableSkeleton({
  rows = 5,
  cols = 4,
  className,
}: {
  rows?: number
  cols?: number
  className?: string
}) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading table"
      className={cn('overflow-hidden rounded-xl border border-border bg-card', className)}
      role="status"
    >
      <div className="flex gap-4 border-b border-border bg-muted/50 px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex gap-4 border-b border-border px-4 py-3 last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function InlineSpinner({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn(
        'size-4 animate-spin rounded-full border-2 border-muted border-t-primary',
        className,
      )}
      {...props}
    />
  )
}
