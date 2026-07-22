import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

type SoftBannerProps = {
  children: ReactNode
  tone?: 'info' | 'warning' | 'success'
  className?: string
}

const toneClass: Record<NonNullable<SoftBannerProps['tone']>, string> = {
  info: 'bg-accent text-accent-foreground border-[var(--ajx-cerulean-100)]',
  warning: 'bg-warning-soft text-warning border-[var(--ajx-amber-100)]',
  success: 'bg-success-soft text-success border-[var(--ajx-emerald-100)]',
}

export function SoftBanner({ children, tone = 'info', className }: SoftBannerProps) {
  return (
    <div
      className={cn(
        'rounded-lg border px-4 py-3 text-sm leading-relaxed',
        toneClass[tone],
        className,
      )}
      role="status"
    >
      {children}
    </div>
  )
}
