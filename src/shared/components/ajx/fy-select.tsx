import { useFy, fyLabel } from '@/app/providers/fy-provider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select'
import { cn } from '@/shared/lib/cn'

type FySelectProps = {
  className?: string
}

/** Compact financial-year picker — replaces the cycle-on-click chip. */
export function FySelect({ className }: FySelectProps) {
  const { fyEndYear, availableYears, setFyEndYear, label } = useFy()

  return (
    <Select value={String(fyEndYear)} onValueChange={(value) => setFyEndYear(Number(value))}>
      <SelectTrigger
        aria-label={`Financial year ${label}. Choose a year.`}
        className={cn(
          'h-auto w-auto min-h-0 gap-1 rounded-sm border-0 bg-primary-soft px-2.5 py-1 text-xs font-semibold text-accent-foreground shadow-none',
          '[&_svg]:size-3.5 [&_svg]:text-accent-foreground/80',
          className,
        )}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {availableYears.map((year) => (
          <SelectItem key={year} value={String(year)}>
            {fyLabel(year)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
