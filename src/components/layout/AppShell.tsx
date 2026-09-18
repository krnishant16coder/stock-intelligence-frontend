import * as React from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Briefcase,
  FileText,
  LayoutDashboard,
  LineChart,
  Menu,
  Moon,
  Plus,
  Settings,
  Sun,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useAlerts, useStocks, useWatchlists } from '@/hooks/useApi'
import { useTheme } from '@/components/theme'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/stocks', label: 'Stocks', icon: Briefcase },
  { to: '/watchlists', label: 'Watchlists', icon: BarChart3 },
  { to: '/reports', label: 'AI Reports', icon: FileText },
  { to: '/alerts', label: 'Critical Alerts', icon: Bell },
  { to: '/settings', label: 'Settings', icon: Settings },
]

function useUnreadCriticalCount(): number | undefined {
  const { data } = useAlerts('NEW')
  if (!data) return undefined
  return data.filter((a) => a.severity === 'CRITICAL').length
}

export function AppShell() {
  const [open, setOpen] = React.useState(false)
  const { theme, toggle } = useTheme()
  const unreadCritical = useUnreadCriticalCount()
  const { data: stocks } = useStocks()
  const { data: watchlists } = useWatchlists()

  // Lock body scroll when mobile drawer is open
  React.useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [open ])

  return (
    <div className="flex min-h-full bg-background">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r bg-card/50 lg:flex" aria-label="Primary">
        <SidebarBody
          unreadCritical={unreadCritical}
          stockCount={stocks?.length}
          watchlistCount={watchlists?.length}
        />
      </aside>

      {/* Mobile drawer */}
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} aria-hidden />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r bg-card shadow-xl">
            <SidebarBody unreadCritical={unreadCritical} stockCount={stocks?.length} watchlistCount={watchlists?.length} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
          <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-2 px-4 sm:px-6">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(true)} aria-label="Open navigation">
              <Menu className="h-5 w-5" aria-hidden />
            </Button>
            <Link to="/" className="flex items-center gap-2 lg:hidden" aria-label="Stock Intelligence home">
              <span className="brand-gradient flex h-7 w-7 items-center justify-center rounded-lg text-white shadow-sm">
                <LineChart className="h-4 w-4" aria-hidden />
              </span>
              <span className="text-sm font-bold tracking-tight">Stock <span className="brand-text">Intelligence</span></span>
            </Link>
            <div className="ml-auto flex items-center gap-1.5">
              {unreadCritical !== undefined && unreadCritical > 0 ? (
                <Button variant="outline" size="sm" asChild className="hidden sm:inline-flex">
                  <Link to="/alerts">
                    <AlertTriangle className="h-3.5 w-3.5 text-red-500" aria-hidden />
                    {unreadCritical} critical
                  </Link>
                </Button>
              ) : null}
              <Button variant="outline" size="sm" asChild className="hidden md:inline-flex">
                <Link to="/stocks"><Plus className="h-3.5 w-3.5" aria-hidden /> Add stock</Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={toggle} aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
                {theme === 'dark' ? <Sun className="h-4 w-4" aria-hidden /> : <Moon className="h-4 w-4" aria-hidden />}
              </Button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:px-6 sm:py-7">
          <Outlet />
        </main>

        <footer className="border-t">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>Stock Intelligence V1 · Research assistance only — not financial advice.</p>
            <p className="font-mono-num">NSE · BSE · DAILY/WEEKLY/MONTHLY</p>
          </div>
        </footer>
      </div>
    </div>
  )
}

function SidebarBody({
  unreadCritical,
  stockCount,
  watchlistCount,
  onNavigate,
}: {
  unreadCritical?: number
  stockCount?: number
  watchlistCount?: number
  onNavigate?: () => void
}) {
  return (
    <>
      <div className="flex items-center gap-2.5 px-5 pb-4 pt-5">
        <span className="brand-gradient flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-md">
          <LineChart className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-tight">Stock <span className="brand-text">Intelligence</span></p>
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">NSE · BSE Research</p>
        </div>
        {onNavigate ? (
          <Button variant="ghost" size="icon" className="ml-auto lg:hidden" aria-label="Close navigation" onClick={onNavigate}>
            <X className="h-4 w-4" aria-hidden />
          </Button>
        ) : null}
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3" aria-label="Sections">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-gradient-to-r from-indigo-100 via-violet-100 to-fuchsia-100 text-foreground shadow-sm dark:from-indigo-950 dark:via-violet-950 dark:to-fuchsia-950'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-violet-600 dark:text-violet-400' : '')} aria-hidden />
                <span className="flex-1">{item.label}</span>
                {item.to === '/alerts' && unreadCritical !== undefined && unreadCritical > 0 ? (
                  <Badge variant="danger" className="px-1.5">{unreadCritical}</Badge>
                ) : null}
                {item.to === '/stocks' && stockCount !== undefined ? (
                  <span className="font-mono-num text-[11px] text-muted-foreground">{stockCount}</span>
                ) : null}
                {item.to === '/watchlists' && watchlistCount !== undefined ? (
                  <span className="font-mono-num text-[11px] text-muted-foreground">{watchlistCount}</span>
                ) : null}
              </>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="p-3">
        <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-indigo-50 via-violet-50 to-fuchsia-50 p-3.5 text-xs leading-relaxed text-muted-foreground dark:border-violet-900 dark:from-indigo-950/60 dark:via-violet-950/40 dark:to-fuchsia-950/30">
          <p className="font-semibold text-foreground">Free-tier data note</p>
          <p className="mt-1">Quotes are end-of-day, not tick-level real-time. Missing data yields INSUFFICIENT_DATA.</p>
        </div>
      </div>
    </>
  )
}
