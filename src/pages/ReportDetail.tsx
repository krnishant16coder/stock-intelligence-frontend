import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarRange, Info, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ErrorState } from '@/components/ui/state'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/page'
import { ConfidenceBar, CriticalFlag, RiskBadge, SignalBadge, TriggerBadge } from '@/components/badges'
import { useReport } from '@/hooks/useApi'
import { getApiErrorMessage } from '@/lib/api'
import { formatConfidence, formatDateTime } from '@/lib/format'

export default function ReportDetailPage() {
  const { id } = useParams()
  const reportId = id !== undefined ? Number(id) : undefined
  const valid = reportId !== undefined && Number.isFinite(reportId)
  const query = useReport(valid ? reportId : undefined)

  if (!valid) {
    return (
      <div className="space-y-5">
        <PageHeader title="Report" />
        <ErrorState title="Invalid report ID" description={`“${id}” is not a valid report identifier.`} />
      </div>
    )
  }

  if (query.isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32" />
        <div className="grid gap-3 md:grid-cols-2"><Skeleton className="h-64" /><Skeleton className="h-64" /></div>
      </div>
    )
  }

  if (query.isError || !query.data) {
    return (
      <div className="space-y-5">
        <PageHeader title="Report" />
        <ErrorState title="Couldn't load report" description={getApiErrorMessage(query.error)} onRetry={() => query.refetch()} />
      </div>
    )
  }

  const r = query.data
  const insufficient = r.analyses.filter((a) => a.signal === 'INSUFFICIENT_DATA')
  const critical = r.analyses.filter((a) => a.criticalAlert)

  return (
    <div className="space-y-5">
      <PageHeader
        title={`Report #${r.id} — ${r.watchlistName}`}
        description={`Generated ${formatDateTime(r.generatedAt)} · ${r.stocksAnalyzed} stock(s) analyzed`}
        actions={
          <Button variant="outline" asChild>
            <Link to="/reports"><ArrowLeft className="h-4 w-4" aria-hidden /> All reports</Link>
          </Button>
        }
      />

      {/* Report meta */}
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">Executive summary</CardTitle>
            <CardDescription className="mt-1 flex flex-wrap items-center gap-2">
              <TriggerBadge trigger={r.triggerType} />
              <span className="inline-flex items-center gap-1"><CalendarRange className="h-3.5 w-3.5" aria-hidden /> {formatDateTime(r.periodStart)} → {formatDateTime(r.periodEnd)}</span>
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-1.5" aria-label="Report flags">
            {critical.length > 0 ? <CriticalFlag /> : null}
            {insufficient.length > 0 ? <Badge variant="warning">{insufficient.length} insufficient-data</Badge> : null}
          </div>
        </CardHeader>
        <CardContent>
          <p className="max-w-3xl whitespace-pre-wrap text-[15px] leading-relaxed">{r.summary || 'No summary provided by the backend.'}</p>
        </CardContent>
      </Card>

      {/* Data-scope notice — honest about V1 API limits */}
      <div className="flex gap-2.5 rounded-xl border border-sky-200 bg-sky-50 p-3.5 text-sm text-sky-950 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-100" role="note">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <p>
          V1 exposes per-stock <span className="font-mono-num">signal, riskLevel, priceTrend, fundamentalTrend, newsImpact, summary, keyReasons, confidence, criticalAlert</span>.
          It does not expose raw prices, chart history, news article lists, or rule-metric payloads — so this view interprets only those fields and never invents numbers.
        </p>
      </div>

      {r.analyses.length === 0 ? (
        <ErrorState title="No per-stock analyses" description="This report contains no detailed analyses." />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {r.analyses.map((a) => (
            <Card key={a.id} className={a.criticalAlert ? 'border-red-300 dark:border-red-800' : ''}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <CardTitle className="font-mono-num text-base">{a.symbol}</CardTitle>
                  <SignalBadge signal={a.signal} />
                  <RiskBadge risk={a.riskLevel} />
                  {a.criticalAlert ? <CriticalFlag /> : null}
                  <span className="ml-auto font-mono-num text-xs text-muted-foreground">{formatConfidence(a.confidence)} conf.</span>
                </div>
                <CardDescription>{a.companyName}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3.5">
                <p className="text-sm leading-relaxed">{a.summary || 'No summary.'}</p>

                <dl className="grid grid-cols-2 gap-2 text-[13px] sm:grid-cols-4">
                  <Trend label="Price trend" value={a.priceTrend} />
                  <Trend label="Fundamental" value={a.fundamentalTrend} />
                  <Trend label="News impact" value={a.newsImpact} />
                  <div className="rounded-lg bg-muted/50 p-2.5">
                    <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Confidence</dt>
                    <dd className="mt-1"><ConfidenceBar value={a.confidence} /></dd>
                  </div>
                </dl>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Key reasons</p>
                  {a.keyReasons.length === 0 ? (
                    <p className="mt-1 text-sm text-muted-foreground">No key reasons provided.</p>
                  ) : (
                    <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm">
                      {a.keyReasons.map((k, i) => <li key={i}>{k}</li>)}
                    </ul>
                  )}
                </div>

                {a.signal === 'INSUFFICIENT_DATA' ? (
                  <div className="flex gap-2 rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-[13px] text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100" role="note">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                    <p><strong>Data limitation:</strong> providers returned no usable quote/fundamental/news window for this stock, so the signal is INSUFFICIENT_DATA with low confidence. Verify vendor coverage for this symbol.</p>
                  </div>
                ) : (a.confidence ?? 1) < 0.4 ? (
                  <p className="rounded-lg bg-muted/60 p-2.5 text-[13px] text-muted-foreground" role="note">
                    Low confidence ({formatConfidence(a.confidence)}) — treat this assessment as tentative and cross-check before acting.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

function Trend({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-lg bg-muted/50 p-2.5">
      <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-[13px] font-medium leading-snug">{value || '—'}</dd>
    </div>
  )
}
