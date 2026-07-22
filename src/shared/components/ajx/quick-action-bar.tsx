import type { ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'
import { Button } from '@/shared/components/ui/button'

export type QuickAction = {
  id: string
  label: string
  icon: ReactNode
  onSelect: () => void
}

type QuickActionBarProps = {
  actions: QuickAction[]
  className?: string
}

export function QuickActionBar({ actions, className }: QuickActionBarProps) {
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {actions.map((action) => (
        <Button
          className="rounded-lg"
          key={action.id}
          onClick={action.onSelect}
          type="button"
          variant="outline"
        >
          <span aria-hidden className="text-primary">
            {action.icon}
          </span>
          {action.label}
        </Button>
      ))}
    </div>
  )
}
