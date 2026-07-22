import * as SeparatorPrimitive from '@radix-ui/react-separator'
import type { ComponentProps } from 'react'
import { cn } from '@/shared/lib/cn'

export function Separator({
  className,
  orientation = 'horizontal',
  decorative = true,
  ...props
}: ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      className={cn(
        'shrink-0 bg-[var(--ajx-line-soft)]',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className,
      )}
      decorative={decorative}
      orientation={orientation}
      {...props}
    />
  )
}
