import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

type IllustrationFrameProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode
}

export function IllustrationFrame({ children, className, ...props }: IllustrationFrameProps) {
  return (
    <div
      className={cn(
        'flex size-28 items-center justify-center rounded-2xl bg-accent text-primary',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  )
}
