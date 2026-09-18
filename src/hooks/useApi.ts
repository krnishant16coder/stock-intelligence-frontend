import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { qk } from '@/lib/query'
import type { Alert, CreateStockPayload, Report, Schedule, Stock, StockAnalysis, UpsertSchedulePayload, Watchlist } from '@/lib/types'

// ---------- Stocks ----------
export function useStocks() {
  return useQuery({ queryKey: qk.stocks, queryFn: () => api.get<Stock[]>('/api/stocks') })
}

export function useCreateStock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: CreateStockPayload) => api.post<Stock>('/api/stocks', p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.stocks })
      qc.invalidateQueries({ queryKey: qk.watchlists })
    },
  })
}

export function useUpdateStock(id: number | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: CreateStockPayload) => api.put<Stock>(`/api/stocks/${id}`, p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.stocks })
      qc.invalidateQueries({ queryKey: qk.watchlists })
    },
  })
}

export function useDeleteStock() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.del<void>(`/api/stocks/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.stocks })
      qc.invalidateQueries({ queryKey: qk.watchlists })
    },
  })
}

export function useStockAnalysis(stockId: number | undefined, limit = 10) {
  return useQuery({
    queryKey: stockId ? qk.stockAnalysis(stockId) : ['stocks', 'analysis', 'none'],
    queryFn: () => api.get<StockAnalysis[]>(`/api/stocks/${stockId}/analysis`, { limit }),
    enabled: stockId !== undefined,
  })
}

// ---------- Watchlists ----------
export function useWatchlists() {
  return useQuery({ queryKey: qk.watchlists, queryFn: () => api.get<Watchlist[]>('/api/watchlists') })
}

export function useCreateWatchlist() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => api.post<Watchlist>('/api/watchlists', { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.watchlists })
      qc.invalidateQueries({ queryKey: qk.schedules })
    },
  })
}

export function useAddStockToWatchlist() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ watchlistId, stockId }: { watchlistId: number; stockId: number }) =>
      api.post<Watchlist>(`/api/watchlists/${watchlistId}/stocks`, { stockId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.watchlists }),
  })
}

export function useRemoveStockFromWatchlist() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ watchlistId, stockId }: { watchlistId: number; stockId: number }) =>
      api.del<void>(`/api/watchlists/${watchlistId}/stocks/${stockId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.watchlists }),
  })
}

// ---------- Schedules + analysis trigger ----------
export function useSchedules() {
  return useQuery({ queryKey: qk.schedules, queryFn: () => api.get<Schedule[]>('/api/schedules') })
}

export function useUpsertSchedule(watchlistId: number | undefined) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (p: UpsertSchedulePayload) => api.put<Schedule>(`/api/watchlists/${watchlistId}/schedule`, p),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.schedules })
      qc.invalidateQueries({ queryKey: qk.watchlists })
    },
  })
}

export function useTriggerAnalysis() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (watchlistId: number) => api.post<Report>(`/api/watchlists/${watchlistId}/analyze`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reports'] })
      qc.invalidateQueries({ queryKey: qk.schedules })
      qc.invalidateQueries({ queryKey: ['alerts'] })
    },
  })
}

// ---------- Reports ----------
export function useReports(watchlistId?: number) {
  return useQuery({
    queryKey: qk.reports(watchlistId),
    queryFn: () => api.get<Report[]>('/api/reports', { watchlistId }),
  })
}

export function useReport(id: number | undefined) {
  return useQuery({
    queryKey: id ? qk.report(id) : ['reports', 'detail', 'none'],
    queryFn: () => api.get<Report>(`/api/reports/${id}`),
    enabled: id !== undefined,
  })
}

// ---------- Alerts ----------
export function useAlerts(status?: string, stockId?: number) {
  return useQuery({
    queryKey: qk.alerts(status, stockId),
    queryFn: () => api.get<Alert[]>('/api/alerts', { status, stockId }),
  })
}

export function useMarkAlertRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.put<Alert>(`/api/alerts/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  })
}

// ---------- System ----------
export function useHealth() {
  return useQuery({
    queryKey: qk.health,
    queryFn: () => api.get<{ status: string; components?: Record<string, { status: string }> }>('/actuator/health'),
    retry: 0,
  })
}
