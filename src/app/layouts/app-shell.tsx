import { NavLink, Outlet } from 'react-router-dom'
import {
  FileStack,
  Home,
  MapPinned,
  Moon,
  Settings,
  Sun,
  Upload,
  Wallet,
} from 'lucide-react'
import { useAuth } from '@/app/providers/auth-provider'
import { useFy } from '@/app/providers/fy-provider'
import { useTheme } from '@/app/providers/theme-provider'
import { Button } from '@/shared/components/ui/button'
import { FyChip } from '@/shared/components/ajx/fy-chip'
import { IconButton } from '@/shared/components/ui/icon-button'
import { BottomNav, SideNav, type NavItemConfig } from '@/shared/components/ajx/navigation'

const nav: NavItemConfig[] = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/overnight', label: 'Overnight', icon: MapPinned },
  { to: '/position', label: 'Position', icon: Wallet },
  { to: '/evidence', label: 'Evidence', icon: FileStack },
  { to: '/export', label: 'Export', icon: Upload },
  { to: '/settings', label: 'Settings', icon: Settings },
]

/** Phone bottom bar — five primary destinations; Settings via header. */
const mobileNav: NavItemConfig[] = nav.filter((item) => item.to !== '/settings')

export function AppShell() {
  const { label, fyEndYear, cycleFy } = useFy()
  const { theme, toggleTheme } = useTheme()
  const { user } = useAuth()
  const fyShort = `${fyEndYear - 1}–${String(fyEndYear).slice(2)}`

  const fyControl = (
    <button
      aria-label={`Financial year ${label}. Activate to cycle years.`}
      className="touch-target text-left"
      type="button"
      onClick={cycleFy}
    >
      <FyChip financialYear={fyShort} />
    </button>
  )

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-[100rem] flex-col md:flex-row">
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
            {fyControl}
            <IconButton label="Toggle theme" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </IconButton>
          </>
        }
        items={nav}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur md:px-6">
          <div className="md:hidden">
            <p className="font-display text-base font-semibold">AJX Tax</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="md:hidden">{fyControl}</div>
            <Button asChild className="md:hidden" size="sm" variant="ghost">
              <NavLink to="/settings">
                <Settings className="size-4" />
                Settings
              </NavLink>
            </Button>
            <Button asChild size="sm" variant="soft">
              <NavLink to="/migration">Import</NavLink>
            </Button>
            <IconButton className="md:hidden" label="Toggle theme" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </IconButton>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 pb-28 md:px-6 md:pb-8">
          <Outlet />
        </main>
      </div>

      <BottomNav aria-label="Mobile" items={mobileNav} />
    </div>
  )
}
