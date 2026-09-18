import * as React from 'react'
import { CalendarClock, Play, Plus, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input, Label } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState, ErrorState } from '@/components/ui/state'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/page'
import { useAddStockToWatchlist, useCreateWatchlist, useRemoveStockFromWatchlist, useSchedules, useStocks, useTriggerAnalysis, useUpsertSchedule, useWatchlists } from '@/hooks/useApi'
import { getApiErrorMessage } from '@/lib/api'
import type { Frequency, Watchlist } from '@/lib/types'
import { formatDateTime } from '@/lib/format'

export default function WatchlistsPage() {
  const watchlists = useWatchlists()
  const schedules = useSchedules()
  const [createOpen, setCreateOpen] = React.useState(false)
  const [selectedId, setSelectedId] = React.useState<number | null>(null)

  const list = watchlists.data ?? []
  // Derive selection during render: explicit choice wins, otherwise first item.
  // If the selected watchlist was deleted, fall back to the first remaining one.
  const selected: Watchlist | null =
    list.find((w) => w.id === selectedId) ?? list[0] ?? null
  const scheduleFor = (id: number) => (schedules.data ?? []).find((s) => s.watchlistId === id)

  if (watchlists.isLoading) {
    return (
      <div className="space-y-5">
        <PageHeader title="Watchlists" description="Group stocks and schedule recurring AI research." />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-64" /><Skeleton className="h-64 lg:col-span-2" />
        </div>
      </div>
    )
  }

  if (watchlists.isError) {
    return (
      <div className="space-y-5">
        <PageHeader title="Watchlists" description="Group stocks and schedule recurring AI research." />
        <ErrorState title="Couldn't load watchlists" description={getApiErrorMessage(watchlists.error)} onRetry={() => watchlists.refetch()} />
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Watchlists"
        description="Group NSE/BSE stocks, configure DAILY / WEEKLY / MONTHLY research schedules, and trigger analysis on demand."
        actions={
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4" aria-hidden /> New watchlist</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create watchlist</DialogTitle>
                <DialogDescription>A focused coverage set — e.g. “India Core 10” or “Banking”.</DialogDescription>
              </DialogHeader>
              <CreateForm onDone={(id) => { setCreateOpen(false); setSelectedId(id) }} />
            </DialogContent>
          </Dialog>
        }
      />

      {list.length === 0 ? (
        <EmptyState
          title="No watchlists yet"
          description="Create your first watchlist, add stocks, set a schedule, then run analysis."
          action={<Button size="sm" onClick={() => setCreateOpen(true)}><Plus className="h-3.5 w-3.5" aria-hidden /> Create watchlist</Button>}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {/* List */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle>All watchlists</CardTitle>
              <CardDescription>{list.length} total</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {list.map((w) => {
                const s = scheduleFor(w.id)
                const active = selected?.id === w.id
                return (
                  <button
                    key={w.id}
                    onClick={() => setSelectedId(w.id)}
                    aria-pressed={active}
                    className={`w-full rounded-lg border p-3 text-left transition-colors ${active ? 'border-primary/50 bg-primary/5' : 'hover:bg-muted/50'}`}
                  >
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold">{w.name}</span>
                      <Badge variant={w.active ? 'success' : 'muted'} className="ml-auto shrink-0">{w.active ? 'Active' : 'Paused'}</Badge>
                    </span>
                    <span className="mt-1 block text-xs text-muted-foreground">
                      {w.stocks.length} stock(s){s ? ` · ${s.frequency} · next ${s.nextRunAt ? formatDateTime(s.nextRunAt) : '—'}` : ' · no schedule'}
                    </span>
                  </button>
                )
              })}
            </CardContent>
          </Card>

          {/* Detail */}
          <div className="space-y-4 lg:col-span-2">
            {selected ? (
              <WatchlistDetail
                key={selected.id}
                watchlist={selected}
                schedule={scheduleFor(selected.id)}
                schedulesLoading={schedules.isLoading}
              />
            ) : null}
          </div>
        </div>
      )}
    </div>
  )
}

function CreateForm({ onDone }: { onDone: (id: number) => void }) {
  const create = useCreateWatchlist()
  const [name, setName] = React.useState('')
  return (
    <form
      className="grid gap-3.5"
      onSubmit={(e) => {
        e.preventDefault()
        create.mutate(name.trim(), {
          onSuccess: (w) => {
            toast.success('Watchlist created', { description: w.name })
            setName('')
            onDone(w.id)
          },
          onError: (err) => toast.error('Could not create watchlist', { description: getApiErrorMessage(err) }),
        })
      }}
    >
      <div className="grid gap-1.5">
        <Label htmlFor="wl-name">Name</Label>
        <Input id="wl-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="India Core 10" required maxLength={120} />
      </div>
      {create.isError ? <p className="text-sm text-destructive" role="alert">{getApiErrorMessage(create.error)}</p> : null}
      <DialogFooter>
        <Button type="submit" disabled={create.isPending}>{create.isPending ? 'Creating…' : 'Create watchlist'}</Button>
      </DialogFooter>
    </form>
  )
}

function WatchlistDetail({
  watchlist,
  schedule,
  schedulesLoading,
}: {
  watchlist: Watchlist
  schedule?: { frequency: Frequency | string; timezone: string; nextRunAt: string | null; lastRunAt: string | null; active: boolean }
  schedulesLoading: boolean
}) {
  const stocks = useStocks()
  const add = useAddStockToWatchlist()
  const remove = useRemoveStockFromWatchlist()
  const trigger = useTriggerAnalysis()
  const [toAdd, setToAdd] = React.useState('')

  const memberIds = new Set(watchlist.stocks.map((s) => s.id))
  const candidates = (stocks.data ?? []).filter((s) => !memberIds.has(s.id))

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
          <div className="min-w-0">
            <CardTitle className="truncate">{watchlist.name}</CardTitle>
            <CardDescription>{watchlist.stocks.length} stock(s) · created {formatDateTime(watchlist.createdAt)}</CardDescription>
          </div>
          <Button
            disabled={trigger.isPending || watchlist.stocks.length === 0}
            onClick={() => trigger.mutate(watchlist.id, {
              onSuccess: (r) => toast.success('Analysis complete', { description: `Report #${r.id} · ${r.stocksAnalyzed} stock(s) analyzed.` }),
              onError: (err) => toast.error('Analysis failed', { description: getApiErrorMessage(err) }),
            })}
          >
            <Play className="h-4 w-4" aria-hidden /> {trigger.isPending ? 'Analyzing…' : 'Trigger analysis'}
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {watchlist.stocks.length === 0 ? (
            <EmptyState title="Empty watchlist" description="Add stocks below to enable analysis." />
          ) : (
            <ul className="divide-y rounded-lg border">
              {watchlist.stocks.map((s) => (
                <li key={s.id} className="flex items-center gap-2 px-3 py-2">
                  <span className="font-mono-num text-sm font-bold">{s.symbol}</span>
                  <Badge variant="secondary">{s.exchange}</Badge>
                  <span className="hidden truncate text-sm text-muted-foreground sm:inline">{s.companyName}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-destructive hover:text-destructive"
                    aria-label={`Remove ${s.symbol}`}
                    disabled={remove.isPending}
                    onClick={() => remove.mutate({ watchlistId: watchlist.id, stockId: s.id }, {
                      onSuccess: () => toast.success('Removed', { description: `${s.symbol} removed from ${watchlist.name}.` }),
                      onError: (err) => toast.error('Could not remove stock', { description: getApiErrorMessage(err) }),
                    })}
                  >
                    <X className="h-3.5 w-3.5" aria-hidden /> Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={toAdd} onValueChange={setToAdd}>
              <SelectTrigger aria-label="Choose a stock to add" className="sm:max-w-xs">
                <SelectValue placeholder={candidates.length === 0 ? 'All stocks already added' : 'Add a stock…'} />
              </SelectTrigger>
              <SelectContent>
                {candidates.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>{s.symbol} · {s.companyName} ({s.exchange})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              disabled={!toAdd || add.isPending}
              onClick={() => add.mutate({ watchlistId: watchlist.id, stockId: Number(toAdd) }, {
                onSuccess: () => {
                  toast.success('Stock added to watchlist')
                  setToAdd('')
                },
                onError: (err) => toast.error('Could not add stock', { description: getApiErrorMessage(err) }),
              })}
            >
              <Plus className="h-4 w-4" aria-hidden /> {add.isPending ? 'Adding…' : 'Add'}
            </Button>
          </div>
          {trigger.isError ? <p className="text-sm text-destructive" role="alert">{getApiErrorMessage(trigger.error)}</p> : null}
          {watchlist.stocks.length === 0 ? (
            <p className="text-xs text-muted-foreground">Analysis requires at least one stock in the watchlist.</p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-muted-foreground" aria-hidden />
            <CardTitle>Research schedule</CardTitle>
          </div>
          <CardDescription>
            {schedulesLoading ? 'Loading schedule…' : schedule
              ? <>Current: <strong className="text-foreground">{schedule.frequency}</strong> · {schedule.timezone} · {schedule.active ? 'active' : 'paused'}{schedule.nextRunAt ? ` · next ${formatDateTime(schedule.nextRunAt)}` : ''}{schedule.lastRunAt ? ` · last ${formatDateTime(schedule.lastRunAt)}` : ''}</>
              : 'No schedule configured yet — set one below.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScheduleForm
            key={`${watchlist.id}-${schedule?.frequency ?? 'none'}-${schedule?.timezone ?? 'none'}-${schedule?.active ?? 'none'}`}
            watchlistId={watchlist.id}
            schedule={schedule}
          />
        </CardContent>
      </Card>
    </>
  )
}

type ScheduleShape = {
  frequency: Frequency | string
  timezone: string
  nextRunAt: string | null
  lastRunAt: string | null
  active: boolean
}

function ScheduleForm({
  watchlistId,
  schedule,
}: {
  watchlistId: number
  schedule?: ScheduleShape
}) {
  const upsert = useUpsertSchedule(watchlistId)
  const [freq, setFreq] = React.useState<Frequency>((schedule?.frequency as Frequency) ?? 'DAILY')
  const [tz, setTz] = React.useState(schedule?.timezone ?? 'Asia/Kolkata')
  const [active, setActive] = React.useState(schedule?.active ?? true)

  return (
    <form
      className="grid gap-3 sm:grid-cols-4"
      onSubmit={(e) => {
        e.preventDefault()
        upsert.mutate({ frequency: freq, timezone: tz.trim() || 'Asia/Kolkata', active }, {
          onSuccess: (s) => toast.success('Schedule saved', { description: `${s.frequency} · next ${s.nextRunAt ? formatDateTime(s.nextRunAt) : '—'}` }),
          onError: (err) => toast.error('Could not save schedule', { description: getApiErrorMessage(err) }),
        })
      }}
    >
      <div className="grid gap-1.5">
        <Label>Frequency</Label>
        <Select value={freq} onValueChange={(v) => setFreq(v as Frequency)}>
          <SelectTrigger aria-label="Frequency"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="DAILY">DAILY</SelectItem>
            <SelectItem value="WEEKLY">WEEKLY</SelectItem>
            <SelectItem value="MONTHLY">MONTHLY</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-1.5 sm:col-span-2">
        <Label htmlFor={`tz-${watchlistId}`}>Timezone</Label>
        <Input id={`tz-${watchlistId}`} value={tz} onChange={(e) => setTz(e.target.value)} placeholder="Asia/Kolkata" />
      </div>
      <div className="grid gap-1.5">
        <Label>Status</Label>
        <Select value={active ? 'active' : 'paused'} onValueChange={(v) => setActive(v === 'active')}>
          <SelectTrigger aria-label="Schedule status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="sm:col-span-4">
        <Button type="submit" variant="secondary" disabled={upsert.isPending}>
          {upsert.isPending ? 'Saving…' : schedule ? 'Update schedule' : 'Save schedule'}
        </Button>
        {upsert.isError ? <p className="mt-2 text-sm text-destructive" role="alert">{getApiErrorMessage(upsert.error)}</p> : null}
      </div>
    </form>
  )
}

export function TrashHint() {
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Trash2 className="h-3 w-3" aria-hidden /> Stocks support delete from the Stocks page.
    </span>
  )
}
