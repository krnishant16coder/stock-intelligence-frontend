import { Link } from 'react-router-dom'
import { ArrowRight, Bell, Briefcase, Layers, Play, Plus, ScanLine, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmptyState, ErrorState } from '@/components/ui/state'
import { CardSkeleton, Skeleton } from '@/components/ui/skeleton'
import { PageHeader, StatCard } from '@/components/page'
import { SeverityBadge, SignalBadge, StatusDot, TriggerBadge } from '@/components/badges'
import { useAlerts, useReports, useStocks, useWatchlists } from '@/hooks/useApi'
import { getApiErrorMessage } from '@/lib/api'
import { formatDateTime, prettifyEnum, timeAgo } from '@/lib/format'

export default function DashboardPage() {
  const stocks = useStocks()
  const watchlists = useWatchlists()
  const alertsNew = useAlerts('NEW')
  const reports = useReports()

  const criticalUnread = alertsNew.data?.filter((a) => a.severity === 'CRITICAL') ?? []
  const recentReports = (reports.data ?? []).slice(0, 5)
  const anyLoading = stocks.isLoading || watchlists.isLoading || alertsNew.isLoading || reports.isLoading
  const anyError = stocks.error ?? watchlists.error ?? alertsNew.error ?? reports.error

  return (
    <div className="space-y-6">
      <PageHeader
        title={<>Good morning — here&apos;s your <span className="brand-text">market intelligence</span></>}
        description="Live view of your coverage, scheduled AI research, and critical risk alerts. All data comes from your Spring Boot backend."
        actions={
          <>
            <Button variant="outline" asChild>
              <Link to="/watchlists"><Play className="h-4 w-4" aria-hidden /> Run analysis</Link>
            </Button>
            <Button asChild>
              <Link to="/stocks"><Plus className="h-4 w-4" aria-hidden /> Add stock</Link>
            </Button>
          </>
        }
      />

      {anyError && !anyLoading ? (
        <ErrorState
          title="Couldn't load dashboard data"
          description={getApiErrorMessage(anyError)}
          onRetry={() => {
            stocks.refetch()
            watchlists.refetch()
            alertsNew.refetch()
            reports.refetch()
          }}
        />
      ) : null}

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label="Stocks tracked"
          loading={stocks.isLoading}
          value={stocks.data?.length ?? 0}
          hint={`${new Set((stocks.data ?? []).map((s) => s.exchange?.toUpperCase())).size || 0} exchange(s) · NSE/BSE`}
          icon={<Briefcase className="h-4 w-4" aria-hidden />}
        />
        <StatCard
          label="Watchlists"
          loading={watchlists.isLoading}
          value={watchlists.data?.length ?? 0}
          hint={`${(watchlists.data ?? []).filter((w) => w.active).length} active`}
          icon={<Layers className="h-4 w-4" aria-hidden />}
          tone="info"
        />
        <StatCard
          label="Unread critical alerts"
          loading={alertsNew.isLoading}
          value={<span className={criticalUnread.length > 0 ? 'text-red-600 dark:text-red-400' : ''}>{criticalUnread.length}</span>}
          hint={criticalUnread.length > 0 ? 'Needs review' : 'All clear'}
          icon={<Bell className="h-4 w-4" aria-hidden />}
          tone={criticalUnread.length > 0 ? 'danger' : 'success'}
        />
        <StatCard
          label="AI reports"
          loading={reports.isLoading}
          value={reports.data?.length ?? 0}
          hint={reports.data?.[0] ? `Latest ${timeAgo(reports.data[0].generatedAt)}` : 'No reports yet'}
          icon={<Sparkles className="h-4 w-4" aria-hidden />}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Recent reports */}
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Recent AI reports</CardTitle>
              <CardDescription>Latest scheduled & manual research output</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/reports">View all <ArrowRight className="h-3.5 w-3.5" aria-hidden /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {reports.isLoading ? (
              <>
                <Skeleton className="h-20" /><Skeleton className="h-20" /><Skeleton className="h-20" />
              </>
            ) : recentReports.length === 0 ? (
              <EmptyState
                title="No reports yet"
                description="Create a watchlist, add stocks, then trigger your first AI analysis."
                action={<Button asChild size="sm"><Link to="/watchlists">Open watchlists</Link></Button>}
              />
            ) : (
              recentReports.map((r) => (
                <Link
                  key={r.id}
                  to={`/reports/${r.id}`}
                  className="block rounded-lg border p-3.5 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold">{r.watchlistName}</span>
                    <TriggerBadge trigger={r.triggerType} />
                    <span className="ml-auto font-mono-num text-xs text-muted-foreground">{formatDateTime(r.generatedAt)}</span>
                  </div>
                  <p className="clamp-2 mt-1.5 text-sm text-muted-foreground">{r.summary || 'No summary available.'}</p>
                  <p className="mt-1.5 text-xs text-muted-foreground">{r.stocksAnalyzed} stock(s) analyzed</p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Critical inbox preview */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Critical inbox</CardTitle>
              <CardDescription>Unread high-severity risk signals</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/alerts">Inbox <ArrowRight className="h-3.5 w-3.5" aria-hidden /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {alertsNew.isLoading ? (
              <><Skeleton className="h-16" /><Skeleton className="h-16" /><Skeleton className="h-16" /></>
            ) : criticalUnread.length === 0 ? (
              <EmptyState title="No unread critical alerts" description="The 4-hour monitor will surface price, volume, and fundamental risks here." />
            ) : (
              criticalUnread.slice(0, 4).map((a) => (
                <Link key={a.id} to="/alerts" className="block rounded-lg border border-red-200 bg-red-50/50 p-3 dark:border-red-900 dark:bg-red-950/30">
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={a.severity} />
                    <span className="font-mono-num text-xs font-bold">{a.symbol}</span>
                    <span className="ml-auto text-[11px] text-muted-foreground">{timeAgo(a.createdAt)}</span>
                  </div>
                  <p className="clamp-2 mt-1 text-xs text-muted-foreground">{a.message}</p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Watchlist overview + quick actions */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Watchlist overview</CardTitle>
              <CardDescription>Coverage and latest signals at a glance</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/watchlists">Manage <ArrowRight className="h-3.5 w-3.5" aria-hidden /></Link>
            </Button>
          </CardHeader>
          <CardContent>
            {watchlists.isLoading ? (
              <div className="grid gap-3 sm:grid-cols-2"><CardSkeleton /><CardSkeleton /></div>
            ) : (watchlists.data ?? []).length === 0 ? (
              <EmptyState
                title="No watchlists yet"
                description="Group NSE/BSE stocks into a watchlist to schedule recurring AI research."
                action={<Button asChild size="sm"><Link to="/watchlists">Create watchlist</Link></Button>}
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {(watchlists.data ?? []).slice(0, 4).map((w) => (
                  <Link key={w.id} to="/watchlists" className="rounded-lg border p-3.5 transition-colors hover:bg-muted/50">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold">{w.name}</span>
                      <Badge variant={w.active ? 'success' : 'muted'} className="ml-auto">{w.active ? 'Active' : 'Paused'}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{w.stocks.length} stock(s)</p>
                    <p className="mt-1 truncate font-mono-num text-[11px] text-muted-foreground">
                      {w.stocks.slice(0, 4).map((s) => s.symbol).join(' · ') || 'Empty'}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Quick actions</CardTitle>
            <CardDescription>Common workflows for daily research</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-2">
            <Button variant="outline" className="justify-start" asChild>
              <Link to="/stocks"><Plus className="h-4 w-4" aria-hidden /> Add a stock (NSE/BSE)</Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link to="/watchlists"><Layers className="h-4 w-4" aria-hidden /> Create watchlist & schedule</Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link to="/watchlists"><Play className="h-4 w-4" aria-hidden /> Trigger manual analysis</Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link to="/reports"><ScanLine className="h-4 w-4" aria-hidden /> Read latest AI report</Link>
            </Button>
            <div className="mt-1 rounded-lg bg-muted/50 p-3 text-xs leading-relaxed text-muted-foreground">
              Signals shown are <SignalBadge signal="HOLD" /> research assists. Always check the{' '}
              <span className="font-medium text-foreground">key reasons + confidence</span> before acting —{' '}
              {prettifyEnum('INSUFFICIENT_DATA')} means the provider had no usable data.
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <StatusDot status="NEW" /> unread <span aria-hidden>·</span> <StatusDot status="READ" /> reviewed
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
