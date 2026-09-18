import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import DashboardPage from '@/pages/Dashboard'
import StocksPage from '@/pages/Stocks'
import WatchlistsPage from '@/pages/Watchlists'
import ReportsPage from '@/pages/Reports'
import ReportDetailPage from '@/pages/ReportDetail'
import AlertsPage from '@/pages/Alerts'
import SettingsPage from '@/pages/Settings'

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/stocks', element: <StocksPage /> },
      { path: '/watchlists', element: <WatchlistsPage /> },
      { path: '/reports', element: <ReportsPage /> },
      { path: '/reports/:id', element: <ReportDetailPage /> },
      { path: '/alerts', element: <AlertsPage /> },
      { path: '/settings', element: <SettingsPage /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])

function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <p className="font-mono-num text-sm text-muted-foreground">404</p>
      <h1 className="mt-2 text-2xl font-bold">Page not found</h1>
      <p className="mt-1 text-sm text-muted-foreground">The page you requested does not exist.</p>
      <a href="/" className="mt-4 text-sm font-medium text-primary underline underline-offset-4">Back to dashboard</a>
    </div>
  )
}

export default function App() {
  return <RouterProvider router={router} />
}
