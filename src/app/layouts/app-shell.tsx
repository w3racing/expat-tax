import { NavLink, Outlet } from 'react-router-dom'
import {
  FileStack,
  Home,
  MapPinned,
  Moon,
  Receipt,
  Settings,
  Sun,
  Upload,
  Wallet,
} from 'lucide-react'
import { useAuth } from '@/app/providers/auth-provider'
import { useTheme } from '@/app/providers/theme-provider'
import { Button } from '@/shared/components/ui/button'
import { FySelect } from '@/shared/components/ajx/fy-select'
import { IconButton } from '@/shared/components/ui/icon-button'
import { BottomNav, SideNav, type NavItemConfig } from '@/shared/components/ajx/navigation'

const nav: NavItemConfig[] = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/overnight', label: 'Overnight', icon: MapPinned },
  { to: '/claim', label: 'Claim', icon: Receipt },
  { to: '/position', label: 'Position', icon: Wallet },
  { to: '/evidence', label: 'Evidence', icon: FileStack },
  { to: '/settings', label: 'Settings', icon: Settings },
]

/** Phone bottom bar — primary workflow tabs; Settings via header gear. */
const mobileNav: NavItemConfig[] = nav.filter((item) => item.to !== '/settings')

export function AppShell() {
  const { theme, toggleTheme } = useTheme()
  const { user } = useAuth()

  return (
    <div className="mx-auto flex h-dvh w-full min-w-0 max-w-[100rem] flex-col md:flex-row">
      <SideNav
        brand={
          <div>
            <p className="font-display text-lg font-semibold tracking-tight text-foreground">
              AJX Tax
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{user?.displayName}</p>
          </div>
        }
        footer={
          <>
            <FySelect />
            <IconButton label="Toggle theme" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </IconButton>
          </>
        }
        items={nav}
      />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex min-w-0 shrink-0 items-center justify-between gap-2 border-b border-border bg-background/80 px-4 py-3 backdrop-blur md:gap-3 md:px-6">
          <div className="min-w-0 shrink md:hidden">
            <p className="truncate font-display text-base font-semibold">AJX Tax</p>
          </div>
          <div className="ml-auto flex min-w-0 shrink-0 items-center justify-end gap-1.5 sm:gap-2">
            <div className="md:hidden">
              <FySelect />
            </div>
            <Button asChild className="md:hidden" size="icon" variant="ghost">
              <NavLink aria-label="Settings" title="Settings" to="/settings">
                <Settings className="size-4" />
              </NavLink>
            </Button>
            <Button asChild className="sm:hidden" size="icon" variant="soft">
              <NavLink aria-label="Import" title="Import" to="/migration">
                <Upload className="size-4" />
              </NavLink>
            </Button>
            <Button asChild className="hidden sm:inline-flex" size="sm" variant="soft">
              <NavLink to="/migration">Import</NavLink>
            </Button>
            <IconButton className="md:hidden" label="Toggle theme" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </IconButton>
          </div>
        </header>

        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-clip px-4 py-6 md:px-6 md:pb-8">
          <Outlet />
        </main>

        <BottomNav aria-label="Mobile" className="shrink-0" items={mobileNav} />
      </div>
    </div>
  )
}
