import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

export const qk = {
  stocks: ['stocks'] as const,
  stockAnalysis: (id: number) => ['stocks', id, 'analysis'] as const,
  stockAlerts: (id: number) => ['stocks', id, 'alerts'] as const,
  watchlists: ['watchlists'] as const,
  schedules: ['schedules'] as const,
  reports: (watchlistId?: number) => ['reports', watchlistId ?? 'all'] as const,
  report: (id: number) => ['reports', 'detail', id] as const,
  alerts: (status?: string, stockId?: number) =>
    ['alerts', status ?? 'all', stockId ?? 'all'] as const,
  health: ['health'] as const,
}
