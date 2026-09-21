import { Activity, Database, Info, Mail, RefreshCw, Server } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ErrorState } from '@/components/ui/state'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/page'
import { useHealth } from '@/hooks/useApi'
import { getApiErrorMessage } from '@/lib/api'

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '(same origin via /api proxy)'

export default function SettingsPage() {
  const health = useHealth()

  return (
    <div className="space-y-5">
      <PageHeader
        title="Settings & System"
        description="Backend connectivity, actuator health, and the available V1 configuration surface. Secrets are never exposed."
        actions={
          <Button variant="outline" onClick={() => health.refetch()} disabled={health.isFetching}>
            <RefreshCw className={`h-4 w-4 ${health.isFetching ? 'animate-spin' : ''}`} aria-hidden /> Refresh status
          </Button>
        }
      />

      {/* API status */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-muted-foreground" aria-hidden />
              <CardTitle>API connection</CardTitle>
            </div>
            <CardDescription>Spring Boot backend reachable at {API_BASE}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {health.isLoading ? (
              <Skeleton className="h-24" />
            ) : health.isError ? (
              <ErrorState
                title="Backend unreachable"
                description={`${getApiErrorMessage(health.error)} Check that Spring Boot is running on :8080, or set VITE_API_URL.`}
                onRetry={() => health.refetch()}
              />
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <Badge variant={health.data?.status === 'UP' ? 'success' : 'danger'}>
                    <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
                    {health.data?.status ?? 'UNKNOWN'}
                  </Badge>
                  <span className="font-mono-num text-xs text-muted-foreground">GET /actuator/health</span>
                </div>
                {health.data?.components ? (
                  <ul className="divide-y rounded-lg border text-sm">
                    {Object.entries(health.data.components).map(([name, c]) => (
                      <li key={name} className="flex items-center gap-2 px-3 py-2">
                        <Activity className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
                        <span className="font-medium">{name}</span>
                        <Badge variant={c.status === 'UP' ? 'success' : 'warning'} className="ml-auto">{c.status}</Badge>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">Health endpoint returned no component breakdown.</p>
                )}
              </div>
            )}
            <dl className="grid gap-2 rounded-lg bg-muted/50 p-3 text-[13px]">
              <Row k="REST base" v="/api (stocks, watchlists, schedules, reports, alerts)" mono />
              <Row k="Health" v="/actuator/health" mono />
              <Row k="Info" v="/actuator/info" mono />
              <Row k="Swagger" v="https://stockintel-api-new-b7bafzh6hhb9edhq.centralindia-01.azurewebsites.net/swagger-ui.html" mono />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" aria-hidden />
              <CardTitle>Available configuration</CardTitle>
            </div>
            <CardDescription>Documented V1 options (values live in backend env — see .env.example).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 text-sm">
            <ConfigGroup title="Providers" rows={[
              ['Market data (APP_MARKET_DATA_PROVIDER)', 'alphavantage (default) · twelvedata'],
              ['News (APP_NEWS_PROVIDER)', 'newsapi (default) · gnews · newsdata (recommended for NSE/BSE)'],
              ['AI (APP_AI_PROVIDER)', 'openai — any OpenAI-compatible AI_BASE_URL'],
            ]} />
            <ConfigGroup title="Analysis thresholds" rows={[
              ['Daily move / weekly decline / monthly decline', '5% · 10% · 15%'],
              ['Volume surge × / avg window', '3.0× · 20 days'],
              ['History / news window', '90 days · 14 days · max 20 articles'],
            ]} />
            <ConfigGroup title="Scheduling & notifications" rows={[
              ['Report check cron', 'hourly — 0 0 * * * *'],
              ['Alert monitor cron', 'every 4h — 0 0 */4 * * *'],
              ['Frequencies', 'DAILY · WEEKLY · MONTHLY (Asia/Kolkata default)'],
            ]} />
            <div className="flex gap-2 rounded-lg border p-3 text-[13px] text-muted-foreground">
              <Mail className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <p>Email notifications (HIGH/CRITICAL) go to NOTIFICATION_EMAIL_TO via MailHog in dev (:8025). Frontend never handles keys.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="h-4 w-4 text-muted-foreground" aria-hidden />
            <CardTitle>Data honesty & limits</CardTitle>
          </div>
          <CardDescription>What this UI will and won't show.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid list-disc gap-1.5 pl-5 text-sm text-muted-foreground sm:grid-cols-2">
            <li>Real backend data only — no fake prices, reports, or alerts.</li>
            <li>Free market-data tiers are end-of-day with daily caps — never tick-level real-time.</li>
            <li>Missing data surfaces as INSUFFICIENT_DATA with low confidence.</li>
            <li>AI output is strict-JSON validated; failures fall back to rule-based analysis.</li>
            <li>Without an AI key the backend still runs end-to-end on the rule-based fallback.</li>
            <li>Research signals are assistance only — not financial advice.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <dt className="font-medium text-muted-foreground">{k}</dt>
      <dd className={mono ? 'font-mono-num text-xs' : 'text-sm'}>{v}</dd>
    </div>
  )
}

function ConfigGroup({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="rounded-lg border">
      <p className="border-b bg-muted/50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <dl className="space-y-1.5 px-3 py-2.5">
        {rows.map(([k, v]) => (
          <div key={k} className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-3">
            <dt className="text-[13px] text-muted-foreground">{k}</dt>
            <dd className="font-mono-num text-xs font-medium">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
