import * as React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, FileText, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState, ErrorState } from '@/components/ui/state'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/page'
import { SignalBadge, TriggerBadge, CriticalFlag } from '@/components/badges'
import { useReports, useWatchlists } from '@/hooks/useApi'
import { getApiErrorMessage } from '@/lib/api'
import { formatDateTime, timeAgo } from '@/lib/format'

export default function ReportsPage() {
  const reportsQuery = useReports()
  const watchlists = useWatchlists()
  const [search, setSearch] = React.useState('')
  const [wlFilter, setWlFilter] = React.useState<string>('ALL')
  const [triggerFilter, setTriggerFilter] = React.useState<string>('ALL')

  const rows = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    return (reportsQuery.data ?? []).filter((r) => {
      if (wlFilter !== 'ALL' && String(r.watchlistId) !== wlFilter) return false
      if (triggerFilter !== 'ALL' && r.triggerType !== triggerFilter) return false
      if (q && !`${r.watchlistName} ${r.summary ?? ''} #${r.id}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [reportsQuery.data, search, wlFilter, triggerFilter])

  return (
    <div className="space-y-5">
      <PageHeader
        title="AI Reports"
        description="Professional research output per watchlist — summary, per-stock signals, confidence, and key reasons. Based strictly on API fields."
      />

      <Card>
        <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:p-5">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search watchlist, summary, or report ID…" aria-label="Search reports" className="pl-9" />
          </div>
          <div className="flex gap-2">
            <Select value={wlFilter} onValueChange={setWlFilter}>
              <SelectTrigger aria-label="Filter by watchlist" className="w-44"><SelectValue placeholder="Watchlist" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All watchlists</SelectItem>
                {(watchlists.data ?? []).map((w) => (
                  <SelectItem key={w.id} value={String(w.id)}>{w.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={triggerFilter} onValueChange={setTriggerFilter}>
              <SelectTrigger aria-label="Filter by trigger" className="w-36"><SelectValue placeholder="Trigger" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All triggers</SelectItem>
                <SelectItem value="MANUAL">MANUAL</SelectItem>
                <SelectItem value="SCHEDULED">SCHEDULED</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {reportsQuery.isLoading ? (
        <div className="grid gap-3 md:grid-cols-2">
          <Skeleton className="h-44" /><Skeleton className="h-44" /><Skeleton className="h-44" /><Skeleton className="h-44" />
        </div>
      ) : reportsQuery.isError ? (
        <ErrorState title="Couldn't load reports" description={getApiErrorMessage(reportsQuery.error)} onRetry={() => reportsQuery.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={(reportsQuery.data ?? []).length === 0 ? 'No reports yet' : 'No matching reports'}
          description={(reportsQuery.data ?? []).length === 0
            ? 'Run your first watchlist analysis to generate an AI research report.'
            : 'Adjust the search or filters.'}
          action={(reportsQuery.data ?? []).length === 0 ? <Button size="sm" asChild><Link to="/watchlists">Go to watchlists</Link></Button> : undefined}
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {rows.map((r) => (
            <Card key={r.id} className="card-hover flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="text-base">#{r.id} · {r.watchlistName}</CardTitle>
                  <TriggerBadge trigger={r.triggerType} />
                  <span className="ml-auto font-mono-num text-xs text-muted-foreground" title={formatDateTime(r.generatedAt)}>{timeAgo(r.generatedAt)}</span>
                </div>
                <CardDescription>
                  {r.stocksAnalyzed} stock(s) · {formatDateTime(r.generatedAt)}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-3">
                <p className="clamp-3 text-sm text-muted-foreground">{r.summary || 'No summary provided.'}</p>
                <Button variant="outline" size="sm" className="mt-auto w-fit" asChild>
                  <Link to={`/reports/${r.id}`}>Open full report <ArrowRight className="h-3.5 w-3.5" aria-hidden /></Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ReportFieldNote />
    </div>
  )
}

export function ReportFieldNote() {
  return (
    <p className="text-xs leading-relaxed text-muted-foreground">
      Report list shows summary fields only (<span className="font-mono-num">id, watchlistName, generatedAt, summary, stocksAnalyzed, triggerType</span>).
      Per-stock signals, confidence, and key reasons load in the detailed view — no data is fabricated.
    </p>
  )
}

export function AnalysisChips({ analyses }: { analyses: { signal: string; criticalAlert: boolean }[] }) {
  const critical = analyses.filter((a) => a.criticalAlert).length
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {analyses.slice(0, 4).map((a, i) => (
        <SignalBadge key={i} signal={a.signal} />
      ))}
      {critical > 0 ? <CriticalFlag /> : null}
      {analyses.length > 4 ? <span className="text-xs text-muted-foreground">+{analyses.length - 4} more</span> : null}
    </span>
  )
}
