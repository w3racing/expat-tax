import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

type StyleguideSectionProps = {
  id: string
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function StyleguideSection({
  id,
  title,
  description,
  children,
  className,
}: StyleguideSectionProps) {
  return (
    <section className={cn('scroll-mt-8 space-y-4', className)} id={id}>
      <div className="space-y-1">
        <h2 className="font-display text-xl font-semibold tracking-tight">{title}</h2>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  )
}
