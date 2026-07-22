import type { TextareaHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        'flex min-h-24 w-full rounded-sm border border-input bg-muted px-3 py-2.5 text-sm text-foreground shadow-xs transition-colors',
        'placeholder:text-[var(--ajx-ink-500)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      )}
      {...props}
    />
  )
}
