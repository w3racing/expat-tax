import type { ReactNode } from 'react'
import { AppCard } from '@/shared/components/ajx/app-card'
import { cn } from '@/shared/lib/cn'

type DashboardCardProps = {
  label: string
  value: string
  hint?: string
  trend?: ReactNode
  chart?: ReactNode
  icon?: ReactNode
  footer?: ReactNode
  className?: string
  /** Larger hero treatment for primary estimate */
  emphasis?: 'default' | 'hero'
  /** Soft wash for financial stance */
  tone?: 'neutral' | 'positive' | 'attention' | 'primary'
  href?: string
}

/** Premium dashboard metric surface — Stripe / Linear / Apple calm. */
export function DashboardCard({
  label,
  value,
  hint,
  trend,
  chart,
  icon,
  footer,
  className,
  emphasis = 'default',
  tone = 'neutral',
}: DashboardCardProps) {
  return (
    <AppCard
      className={cn(
        'relative overflow-hidden',
        tone === 'positive' && 'border-success/25 bg-success-soft/40 dark:bg-success/10',
        tone === 'attention' && 'border-warning/30 bg-warning-soft/50 dark:bg-warning/10',
        tone === 'primary' && 'border-primary/25 bg-primary-soft/50 dark:bg-primary/10',
        emphasis === 'hero' && 'md:col-span-2',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <p className="text-overline">{label}</p>
          <p
            className={cn(
              'font-display font-semibold tracking-tight text-foreground text-amount',
              emphasis === 'hero' ? 'text-3xl md:text-4xl' : 'text-2xl',
            )}
          >
            {value}
          </p>
          {hint ? <p className="text-sm leading-relaxed text-muted-foreground">{hint}</p> : null}
          {trend ? <div className="pt-1">{trend}</div> : null}
        </div>
        {icon ? (
          <div
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-xl',
              tone === 'positive' && 'bg-success-soft text-success',
              tone === 'attention' && 'bg-warning-soft text-warning',
              tone === 'primary' && 'bg-accent text-primary',
              tone === 'neutral' && 'bg-accent text-primary',
            )}
          >
            {icon}
          </div>
        ) : null}
      </div>
      {chart ? <div className="mt-4">{chart}</div> : null}
      {footer ? <div className="mt-4 border-t border-border/80 pt-3">{footer}</div> : null}
    </AppCard>
  )
}
