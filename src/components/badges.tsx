import { Badge } from '@/components/ui/badge'
import type { AlertStatus, RiskLevel, Severity, Signal } from '@/lib/types'
import { cn } from '@/lib/utils'

export function SignalBadge({ signal }: { signal?: string | null }) {
  const s = (signal ?? '').toUpperCase()
  const variant =
    s === 'BUY_MORE' ? 'success' : s === 'HOLD' ? 'info' : s === 'REVIEW' ? 'warning' : s === 'HIGH_RISK' ? 'danger' : 'muted'
  const label: Record<string, string> = {
    BUY_MORE: 'Buy more',
    HOLD: 'Hold',
    REVIEW: 'Review',
    HIGH_RISK: 'High risk',
    INSUFFICIENT_DATA: 'Insufficient data',
  }
  return (
    <Badge variant={variant as 'success'} className="whitespace-nowrap">
      {label[s] ?? (signal || '—')}
    </Badge>
  )
}

export function RiskBadge({ risk }: { risk?: string | null }) {
  const r = (risk ?? '').toUpperCase() as RiskLevel | string
  const variant = r === 'LOW' ? 'success' : r === 'MEDIUM' ? 'info' : r === 'HIGH' ? 'warning' : r === 'CRITICAL' ? 'danger' : 'muted'
  return <Badge variant={variant as 'success'}>{risk ?? '—'}</Badge>
}

export function SeverityBadge({ severity }: { severity?: Severity | string | null }) {
  const s = (severity ?? '').toUpperCase()
  const variant = s === 'LOW' ? 'success' : s === 'MEDIUM' ? 'info' : s === 'HIGH' ? 'warning' : s === 'CRITICAL' ? 'danger' : 'muted'
  return (
    <Badge variant={variant as 'success'} className="whitespace-nowrap">
      <span className={cn('h-1.5 w-1.5 rounded-full', s === 'CRITICAL' ? 'bg-current animate-pulse' : 'bg-current')} aria-hidden />
      {severity ?? '—'}
    </Badge>
  )
}

export function StatusDot({ status }: { status?: AlertStatus | string | null }) {
  const unread = (status ?? '').toUpperCase() === 'NEW'
  return (
    <span className="inline-flex items-center gap-1.5 text-xs" aria-label={unread ? 'Unread' : 'Read'}>
      <span className={cn('h-2 w-2 rounded-full', unread ? 'bg-sky-500' : 'bg-muted-foreground/40')} aria-hidden />
      <span className={unread ? 'font-semibold text-foreground' : 'text-muted-foreground'}>{unread ? 'Unread' : 'Read'}</span>
    </span>
  )
}

export function ConfidenceBar({ value }: { value?: number | null }) {
  if (value === null || value === undefined) return <span className="text-sm text-muted-foreground">—</span>
  const pct = Math.round(value * 100)
  const tone = pct >= 75 ? 'bg-emerald-500' : pct >= 50 ? 'bg-sky-500' : pct >= 30 ? 'bg-amber-500' : 'bg-red-500'
  return (
    <span className="inline-flex min-w-[120px] items-center gap-2">
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted" role="img" aria-label={`Confidence ${pct}%`}>
        <span className={`block h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
      </span>
      <span className="font-mono-num text-xs text-muted-foreground">{pct}%</span>
    </span>
  )
}

export function TriggerBadge({ trigger }: { trigger?: string | null }) {
  return <Badge variant={trigger === 'MANUAL' ? 'secondary' : 'outline'}>{trigger ?? '—'}</Badge>
}

export function CriticalFlag() {
  return <Badge variant="danger">Critical</Badge>
}

export type { Signal }
