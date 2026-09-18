import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './components/theme.tsx'
import { queryClient } from './lib/query.ts'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster richColors position="top-right" toastOptions={{ duration: 3500 }} />
      </QueryClientProvider>
    </ThemeProvider>
  </StrictMode>,
)
