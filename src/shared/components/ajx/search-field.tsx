import { Search } from 'lucide-react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '@/shared/lib/cn'
import { Input } from '@/shared/components/ui/input'

type SearchFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  containerClassName?: string
}

export function SearchField({ className, containerClassName, ...props }: SearchFieldProps) {
  return (
    <label className={cn('relative block w-full', containerClassName)}>
      <span className="sr-only">{props['aria-label'] ?? 'Search'}</span>
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--ajx-ink-500)]"
      />
      <Input className={cn('pl-10', className)} type="search" {...props} />
    </label>
  )
}
