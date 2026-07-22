import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import { AppCard } from '@/shared/components/ajx/app-card'

type StatCardProps = {
  label: string
  value: string
  hint?: string
  icon?: ReactNode
  className?: string
}

export function StatCard({ label, value, hint, icon, className }: StatCardProps) {
  return (
    <AppCard className={cn(className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-overline">{label}</p>
          <p className="font-display text-2xl font-semibold tracking-tight text-foreground">
            {value}
          </p>
          {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
        </div>
        {icon ? (
          <div className="flex size-10 items-center justify-center rounded-md bg-accent text-primary">
            {icon}
          </div>
        ) : null}
      </div>
    </AppCard>
  )
}
