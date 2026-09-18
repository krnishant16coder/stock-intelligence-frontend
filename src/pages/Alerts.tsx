import * as React from 'react'
import { Bell, CheckCheck, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState, ErrorState } from '@/components/ui/state'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/page'
import { SeverityBadge, StatusDot } from '@/components/badges'
import { useAlerts, useMarkAlertRead, useStocks } from '@/hooks/useApi'
import { getApiErrorMessage } from '@/lib/api'
import { formatDateTime, prettifyEnum, timeAgo } from '@/lib/format'
import { cn } from '@/lib/utils'

type StatusFilter = 'ALL' | 'NEW' | 'READ'
type SeverityFilter = 'ALL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export default function AlertsPage() {
  const [status, setStatus] = React.useState<StatusFilter>('ALL')
  const [severity, setSeverity] = React.useState<SeverityFilter>('ALL')
  const [stockFilter, setStockFilter] = React.useState<string>('ALL')
  const [search, setSearch] = React.useState('')

  // Backend supports ?status= & ?stockId= ; severity + text are client-side refinements.
  const query = useAlerts(status === 'ALL' ? undefined : status, stockFilter === 'ALL' ? undefined : Number(stockFilter))
  const stocks = useStocks()
  const markRead = useMarkAlertRead()

  const rows = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return (query.data ?? [])
      .filter((a) => (severity === 'ALL' ? true : a.severity === severity))
      .filter((a) => (q ? `${a.symbol} ${a.companyName} ${a.message} ${a.alertType}`.toLowerCase().includes(q) : true))
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
  }, [query.data, severity, search])

  const unread = (query.data ?? []).filter((a) => a.status === 'NEW').length

  const markAllVisible = () => {
    const targets = rows.filter((a) => a.status === 'NEW')
    if (targets.length === 0) return
    Promise.allSettled(targets.map((a) => markRead.mutateAsync(a.id))).then((results) => {
      const failed = results.filter((r) => r.status === 'rejected').length
      if (failed === 0) toast.success(`Marked ${targets.length} alert(s) as read`)
      else toast.error(`${failed} of ${targets.length} could not be marked read`)
    })
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Critical Alerts"
        description={unread > 0 ? `${unread} unread alert(s) need review. The monitor runs every 4 hours, independent of report schedules.` : 'Risk inbox. The monitor runs every 4 hours, independent of report schedules.'}
        actions={
          <Button variant="outline" onClick={markAllVisible} disabled={markRead.isPending || rows.every((a) => a.status !== 'NEW')}>
            <CheckCheck className="h-4 w-4" aria-hidden /> {markRead.isPending ? 'Marking…' : 'Mark visible as read'}
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-col gap-2 p-4 sm:p-5 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search symbol, message, or type…" aria-label="Search alerts" className="pl-9" />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="flex rounded-lg border p-0.5 text-sm" role="tablist" aria-label="Read status filter">
              {(['ALL', 'NEW', 'READ'] as StatusFilter[]).map((s) => (
                <button
                  key={s}
                  role="tab"
                  aria-selected={status === s}
                  onClick={() => setStatus(s)}
                  className={cn(
                    'rounded-md px-3 py-1.5 font-medium transition-colors',
                    status === s ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {s === 'ALL' ? 'All' : s === 'NEW' ? 'Unread' : 'Read'}
                </button>
              ))}
            </div>
            <Select value={severity} onValueChange={(v) => setSeverity(v as SeverityFilter)}>
              <SelectTrigger aria-label="Severity filter" className="w-36"><SelectValue placeholder="Severity" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All severities</SelectItem>
                <SelectItem value="CRITICAL">CRITICAL</SelectItem>
                <SelectItem value="HIGH">HIGH</SelectItem>
                <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                <SelectItem value="LOW">LOW</SelectItem>
              </SelectContent>
            </Select>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger aria-label="Stock filter" className="w-44"><SelectValue placeholder="Stock" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All stocks</SelectItem>
                {(stocks.data ?? []).map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.symbol} ({s.exchange})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {query.isLoading ? (
        <div className="space-y-2.5"><Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" /></div>
      ) : query.isError ? (
        <ErrorState title="Couldn't load alerts" description={getApiErrorMessage(query.error)} onRetry={() => query.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={(query.data ?? []).length === 0 ? 'No alerts yet' : 'No matching alerts'}
          description={(query.data ?? []).length === 0
            ? 'When the monitor detects price, volume, or fundamental risk, alerts appear here.'
            : 'Try widening the status, severity, or stock filters.'}
        />
      ) : (
        <ul className="space-y-2.5" aria-label="Alerts">
          {rows.map((a) => {
            const unreadRow = a.status === 'NEW'
            return (
              <li
                key={a.id}
                className={cn(
                  'rounded-xl border p-4 transition-colors',
                  a.severity === 'CRITICAL' && unreadRow
                    ? 'border-red-300 bg-red-50/60 dark:border-red-800 dark:bg-red-950/30'
                    : unreadRow
                      ? 'border-sky-200 bg-sky-50/40 dark:border-sky-900 dark:bg-sky-950/20'
                      : 'bg-card',
                )}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <SeverityBadge severity={a.severity} />
                  <Badge variant="outline">{prettifyEnum(a.alertType)}</Badge>
                  <span className="font-mono-num text-sm font-bold">{a.symbol}</span>
                  <span className="hidden truncate text-sm text-muted-foreground sm:inline">{a.companyName}</span>
                  <span className="ml-auto flex items-center gap-3">
                    <StatusDot status={a.status} />
                    <span className="font-mono-num text-xs text-muted-foreground" title={formatDateTime(a.createdAt)}>{timeAgo(a.createdAt)}</span>
                  </span>
                </div>
                <p className="mt-2 text-sm leading-relaxed">{a.message}</p>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <span className="font-mono-num text-[11px] text-muted-foreground">#{a.id} · {formatDateTime(a.createdAt)} · {a.status}</span>
                  {unreadRow ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-auto"
                      disabled={markRead.isPending}
                      onClick={() => markRead.mutate(a.id, {
                        onSuccess: () => toast.success('Marked as read', { description: `${a.symbol} · ${prettifyEnum(a.alertType)}` }),
                        onError: (err) => toast.error('Could not mark as read', { description: getApiErrorMessage(err) }),
                      })}
                    >
                      Mark as read
                    </Button>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
