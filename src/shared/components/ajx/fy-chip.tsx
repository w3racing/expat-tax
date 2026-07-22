import { cn } from '@/shared/lib/cn'
import { Badge } from '@/shared/components/ui/badge'

type FyChipProps = {
  financialYear: string
  className?: string
}

export function FyChip({ financialYear, className }: FyChipProps) {
  return (
    <Badge className={cn('font-medium', className)} variant="primary">
      FY {financialYear}
    </Badge>
  )
}
