import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/shared/lib/cn'

type ClaimNavLinkProps = {
  to: string
  title: string
  subtitle: string
  className?: string
}

/** Calculator-style list row: title, subtitle, chevron. */
export function ClaimNavLink({ to, title, subtitle, className }: ClaimNavLinkProps) {
  return (
    <Link
      className={cn(
        'flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 shadow-sm active:bg-muted/70',
        'transition-colors hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        'min-h-14 touch-target',
        className,
      )}
      to={to}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-base font-semibold text-foreground">{title}</span>
        <span className="mt-0.5 block text-sm text-muted-foreground">{subtitle}</span>
      </span>
      <ChevronRight aria-hidden className="size-5 shrink-0 text-muted-foreground" />
    </Link>
  )
}
