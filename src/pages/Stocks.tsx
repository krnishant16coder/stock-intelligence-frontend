import * as React from 'react'
import { Link } from 'react-router-dom'
import { ArrowUpDown, Eye, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input, Label } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState, ErrorState } from '@/components/ui/state'
import { TableSkeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/page'
import { SignalBadge, ConfidenceBar } from '@/components/badges'
import { useAlerts, useCreateStock, useDeleteStock, useStockAnalysis, useStocks, useUpdateStock } from '@/hooks/useApi'
import { getApiErrorMessage } from '@/lib/api'
import type { Stock } from '@/lib/types'
import { formatDateTime, prettifyEnum } from '@/lib/format'

type ExchangeFilter = 'ALL' | 'NSE' | 'BSE'

export default function StocksPage() {
  const stocksQuery = useStocks()
  const [search, setSearch] = React.useState('')
  const [exchange, setExchange] = React.useState<ExchangeFilter>('ALL')
  const [sortAsc, setSortAsc] = React.useState(true)
  const [detail, setDetail] = React.useState<Stock | null>(null)
  const [editing, setEditing] = React.useState<Stock | null>(null)
  const [addOpen, setAddOpen] = React.useState(false)

  const rows = React.useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = stocksQuery.data ?? []
    if (exchange !== 'ALL') list = list.filter((s) => s.exchange?.toUpperCase() === exchange)
    if (q) list = list.filter((s) => (s.symbol ?? '').toLowerCase().includes(q) || (s.companyName ?? '').toLowerCase().includes(q))
    return [...list].sort((a, b) => (sortAsc ? (a.symbol ?? '').localeCompare(b.symbol ?? '') : (b.symbol ?? '').localeCompare(a.symbol ?? '')))
  }, [stocksQuery.data, search, exchange, sortAsc])

  return (
    <div className="space-y-5">
      <PageHeader
        title="Stocks"
        description="Your tracked NSE/BSE universe. Prices are not stored by V1 — research signals come from AI reports."
        actions={
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4" aria-hidden /> Add stock</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a stock</DialogTitle>
                <DialogDescription>Symbol + exchange must be unique. Use NSE/BSE scrip codes, e.g. RELIANCE.</DialogDescription>
              </DialogHeader>
              <StockForm onDone={() => setAddOpen(false)} />
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <CardContent className="space-y-3 p-4 sm:p-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search symbol or company…"
                aria-label="Search stocks"
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border p-0.5 text-sm" role="tablist" aria-label="Exchange filter">
                {(['ALL', 'NSE', 'BSE'] as ExchangeFilter[]).map((f) => (
                  <button
                    key={f}
                    role="tab"
                    aria-selected={exchange === f}
                    onClick={() => setExchange(f)}
                    className={`rounded-md px-3 py-1.5 font-medium transition-colors ${exchange === f ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                  >
                    {f === 'ALL' ? 'All' : f}
                  </button>
                ))}
              </div>
              <Button variant="outline" size="sm" onClick={() => setSortAsc((v) => !v)} aria-label="Toggle sort order">
                <ArrowUpDown className="h-3.5 w-3.5" aria-hidden /> {sortAsc ? 'A–Z' : 'Z–A'}
              </Button>
            </div>
          </div>

          {stocksQuery.isLoading ? (
            <TableSkeleton rows={6} cols={4} />
          ) : stocksQuery.isError ? (
            <ErrorState
              title="Couldn't load stocks"
              description={getApiErrorMessage(stocksQuery.error)}
              onRetry={() => stocksQuery.refetch()}
            />
          ) : rows.length === 0 ? (
            <EmptyState
              title={(stocksQuery.data ?? []).length === 0 ? 'No stocks yet' : 'No matches'}
              description={(stocksQuery.data ?? []).length === 0
                ? 'Add your first NSE/BSE stock to start building watchlists.'
                : 'Try a different search term or exchange filter.'}
              action={(stocksQuery.data ?? []).length === 0 ? <Button size="sm" onClick={() => setAddOpen(true)}><Plus className="h-3.5 w-3.5" aria-hidden /> Add stock</Button> : undefined}
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden overflow-x-auto rounded-lg border md:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground">
                      <th scope="col" className="px-4 py-2.5 font-semibold">Symbol</th>
                      <th scope="col" className="px-4 py-2.5 font-semibold">Company</th>
                      <th scope="col" className="px-4 py-2.5 font-semibold">Exchange</th>
                      <th scope="col" className="px-4 py-2.5 font-semibold">Added</th>
                      <th scope="col" className="px-4 py-2.5 text-right font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((s) => (
                      <tr key={s.id} className="border-b last:border-0 hover:bg-muted/40">
                        <td className="px-4 py-2.5 font-mono-num font-bold">{s.symbol}</td>
                        <td className="max-w-[280px] truncate px-4 py-2.5">{s.companyName}</td>
                        <td className="px-4 py-2.5"><Badge variant="secondary">{s.exchange}</Badge></td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-muted-foreground">{formatDateTime(s.createdAt)}</td>
                        <td className="px-4 py-2.5">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => setDetail(s)} aria-label={`View ${s.symbol} details`}><Eye className="h-3.5 w-3.5" aria-hidden /> View</Button>
                            <Button variant="ghost" size="sm" onClick={() => setEditing(s)} aria-label={`Edit ${s.symbol}`}><Pencil className="h-3.5 w-3.5" aria-hidden /></Button>
                            <DeleteButton stock={s} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Mobile cards */}
              <ul className="grid gap-2 md:hidden">
                {rows.map((s) => (
                  <li key={s.id} className="rounded-lg border p-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono-num text-sm font-bold">{s.symbol}</span>
                      <Badge variant="secondary">{s.exchange}</Badge>
                      <span className="ml-auto text-[11px] text-muted-foreground">{formatDateTime(s.createdAt)}</span>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">{s.companyName}</p>
                    <div className="mt-2.5 flex gap-1.5">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => setDetail(s)}>Details</Button>
                      <Button variant="outline" size="sm" onClick={() => setEditing(s)} aria-label={`Edit ${s.symbol}`}><Pencil className="h-3.5 w-3.5" aria-hidden /></Button>
                      <DeleteButton stock={s} />
                    </div>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground" role="status">{rows.length} of {(stocksQuery.data ?? []).length} stocks</p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail dialog */}
      <Dialog open={detail !== null} onOpenChange={(o) => { if (!o) setDetail(null) }}>
        <DialogContent className="max-w-xl">
          {detail ? <StockDetail stock={detail} onClose={() => setDetail(null)} /> : null}
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={editing !== null} onOpenChange={(o) => { if (!o) setEditing(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editing?.symbol}</DialogTitle>
            <DialogDescription>Update the company name or exchange mapping.</DialogDescription>
          </DialogHeader>
          {editing ? <StockForm key={editing.id} initial={editing} onDone={() => setEditing(null)} /> : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StockForm({ initial, onDone }: { initial?: Stock; onDone: () => void }) {
  const create = useCreateStock()
  const update = useUpdateStock(initial?.id)
  const [symbol, setSymbol] = React.useState(initial?.symbol ?? '')
  const [companyName, setCompanyName] = React.useState(initial?.companyName ?? '')
  const [exchange, setExchange] = React.useState(initial?.exchange ?? 'NSE')
  const mut = initial ? update : create
  const busy = mut.isPending

  return (
    <form
      className="grid gap-3.5"
      onSubmit={(e) => {
        e.preventDefault()
        mut.mutate(
          { symbol: symbol.trim().toUpperCase(), companyName: companyName.trim(), exchange: exchange.trim().toUpperCase() },
          {
            onSuccess: () => {
              toast.success(initial ? 'Stock updated' : 'Stock added', { description: `${symbol.trim().toUpperCase()} is now tracked.` })
              onDone()
            },
            onError: (err) => toast.error(initial ? 'Update failed' : 'Could not add stock', { description: getApiErrorMessage(err) }),
          },
        )
      }}
    >
      <div className="grid gap-1.5">
        <Label htmlFor={initial ? 'edit-symbol' : 'add-symbol'}>Symbol</Label>
        <Input id={initial ? 'edit-symbol' : 'add-symbol'} value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="RELIANCE" maxLength={32} required className="font-mono-num uppercase" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor={initial ? 'edit-company' : 'add-company'}>Company name</Label>
        <Input id={initial ? 'edit-company' : 'add-company'} value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Reliance Industries" maxLength={255} required />
      </div>
      <div className="grid gap-1.5">
        <Label>Exchange</Label>
        <Select value={exchange.toUpperCase()} onValueChange={setExchange}>
          <SelectTrigger aria-label="Exchange"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="NSE">NSE</SelectItem>
            <SelectItem value="BSE">BSE</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {mut.isError ? <p className="text-sm text-destructive" role="alert">{getApiErrorMessage(mut.error)}</p> : null}
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>Cancel</Button>
        <Button type="submit" disabled={busy}>{busy ? 'Saving…' : initial ? 'Save changes' : 'Add stock'}</Button>
      </DialogFooter>
    </form>
  )
}

function DeleteButton({ stock }: { stock: Stock }) {
  const del = useDeleteStock()
  const [confirm, setConfirm] = React.useState(false)
  if (!confirm) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setConfirm(true)} aria-label={`Delete ${stock.symbol}`} className="text-destructive hover:text-destructive">
        <Trash2 className="h-3.5 w-3.5" aria-hidden />
      </Button>
    )
  }
  return (
    <span className="inline-flex items-center gap-1">
      <Button variant="destructive" size="sm" disabled={del.isPending} onClick={() => del.mutate(stock.id, {
        onSuccess: () => toast.success('Stock deleted', { description: stock.symbol }),
        onError: (err) => toast.error('Delete failed', { description: getApiErrorMessage(err) }),
      })}>
        {del.isPending ? '…' : 'Confirm'}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirm(false)}>Keep</Button>
    </span>
  )
}

function StockDetail({ stock, onClose }: { stock: Stock; onClose: () => void }) {
  const analysis = useStockAnalysis(stock.id, 5)
  const alerts = useAlerts(undefined, stock.id)
  const latest = analysis.data?.[0]

  return (
    <div className="space-y-4">
      <DialogHeader>
        <div className="flex flex-wrap items-center gap-2 pr-8">
          <DialogTitle className="font-mono-num">{stock.symbol}</DialogTitle>
          <Badge variant="secondary">{stock.exchange}</Badge>
          {latest ? <SignalBadge signal={latest.signal} /> : null}
        </div>
        <DialogDescription>{stock.companyName} · Added {formatDateTime(stock.createdAt)}</DialogDescription>
      </DialogHeader>

      <div className="rounded-lg border bg-muted/40 p-3.5 text-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Latest AI assessment</p>
        {analysis.isLoading ? (
          <p className="mt-1 text-sm text-muted-foreground">Loading analysis…</p>
        ) : !latest ? (
          <p className="mt-1 text-sm text-muted-foreground">
            No analysis yet for this stock. Trigger a watchlist analysis to generate one. <Link to="/reports" className="text-primary underline underline-offset-2">Browse reports</Link>
          </p>
        ) : (
          <div className="mt-2 space-y-1.5">
            <p className="text-sm">{latest.summary || 'No summary.'}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span>Risk: <strong className="text-foreground">{latest.riskLevel}</strong></span>
              <span>Price: {latest.priceTrend}</span>
              <span>Fundamentals: {latest.fundamentalTrend}</span>
              <span>News: {latest.newsImpact}</span>
              <ConfidenceBar value={latest.confidence} />
            </div>
            {latest.keyReasons.length > 0 ? (
              <ul className="list-disc space-y-0.5 pl-5 text-[13px]">
                {latest.keyReasons.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            ) : null}
          </div>
        )}
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Alerts for this stock ({alerts.data?.length ?? 0})</p>
        {alerts.isLoading ? (
          <p className="mt-1 text-sm text-muted-foreground">Loading alerts…</p>
        ) : (alerts.data ?? []).length === 0 ? (
          <p className="mt-1 text-sm text-muted-foreground">No alerts recorded.</p>
        ) : (
          <ul className="mt-2 space-y-1.5">
            {(alerts.data ?? []).slice(0, 5).map((a) => (
              <li key={a.id} className="rounded-lg border p-2.5 text-[13px]">
                <span className="font-semibold">{prettifyEnum(a.alertType)}</span>
                <span className="text-muted-foreground"> · {a.severity} · {formatDateTime(a.createdAt)}</span>
                <p className="mt-0.5 text-muted-foreground">{a.message}</p>
              </li>
            ))}
          </ul>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Close</Button>
      </DialogFooter>
    </div>
  )
}
