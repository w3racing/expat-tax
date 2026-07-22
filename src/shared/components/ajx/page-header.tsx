import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

type PageHeaderProps = {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="space-y-2">
        <h1 className="font-display text-[1.75rem] font-semibold leading-tight tracking-tight text-foreground md:text-[2rem]">
          {title}
        </h1>
        {description ? (
          <p className="max-w-xl text-base text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  )
}
