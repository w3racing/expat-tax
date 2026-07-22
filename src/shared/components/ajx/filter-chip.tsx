import { cn } from '@/shared/lib/cn'

type FilterChipProps = {
  label: string
  selected?: boolean
  onToggle?: () => void
  className?: string
}

export function FilterChip({ label, selected = false, onToggle, className }: FilterChipProps) {
  return (
    <button
      aria-pressed={selected}
      className={cn(
        'inline-flex min-h-11 items-center rounded-full border px-3.5 text-sm font-semibold transition-colors touch-target',
        selected
          ? 'border-primary bg-primary-soft text-accent-foreground'
          : 'border-border bg-card text-muted-foreground hover:bg-muted',
        className,
      )}
      onClick={onToggle}
      type="button"
    >
      {label}
    </button>
  )
}
