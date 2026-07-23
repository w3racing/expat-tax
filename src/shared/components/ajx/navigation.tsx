import type { ComponentType, ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'

export type NavItemConfig = {
  to: string
  label: string
  icon: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>
  end?: boolean
}

type NavItemProps = {
  item: NavItemConfig
  variant?: 'side' | 'bottom'
  className?: string
}

export function NavItem({ item, variant = 'side', className }: NavItemProps) {
  const Icon = item.icon

  return (
    <NavLink
      className={({ isActive }) =>
        cn(
          variant === 'side' &&
            'flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
          variant === 'side' &&
            (isActive
              ? 'bg-primary-soft text-accent-foreground'
              : 'text-muted-foreground hover:bg-muted hover:text-foreground'),
          variant === 'bottom' &&
            'flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-0.5 py-2 text-[0.65rem] font-medium transition-colors',
          variant === 'bottom' && (isActive ? 'text-primary' : 'text-muted-foreground'),
          className,
        )
      }
      end={item.end}
      to={item.to}
    >
      <Icon aria-hidden className={variant === 'bottom' ? 'size-5 shrink-0' : 'size-4'} />
      <span className={variant === 'bottom' ? 'max-w-full truncate' : undefined}>{item.label}</span>
    </NavLink>
  )
}

type BottomNavProps = {
  items: NavItemConfig[]
  className?: string
  'aria-label'?: string
}

export function BottomNav({ items, className, 'aria-label': ariaLabel = 'Primary' }: BottomNavProps) {
  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        'z-20 flex w-full border-t border-border bg-card/95 px-1 py-1 backdrop-blur',
        'pb-[max(0.25rem,env(safe-area-inset-bottom))]',
        'md:hidden',
        className,
      )}
    >
      {items.map((item) => (
        <NavItem key={item.to} item={item} variant="bottom" />
      ))}
    </nav>
  )
}

type SideNavProps = {
  items: NavItemConfig[]
  brand?: ReactNode
  footer?: ReactNode
  className?: string
  'aria-label'?: string
}

export function SideNav({
  items,
  brand,
  footer,
  className,
  'aria-label': ariaLabel = 'Primary',
}: SideNavProps) {
  return (
    <aside
      className={cn(
        'hidden w-56 shrink-0 flex-col gap-6 border-r border-border bg-card/60 p-4 backdrop-blur md:flex lg:w-64',
        className,
      )}
    >
      {brand}
      <nav aria-label={ariaLabel} className="flex flex-1 flex-col gap-1">
        {items.map((item) => (
          <NavItem key={item.to} item={item} variant="side" />
        ))}
      </nav>
      {footer ? <div className="mt-auto space-y-2">{footer}</div> : null}
    </aside>
  )
}
