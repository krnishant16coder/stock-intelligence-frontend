import * as React from 'react'

type Theme = 'light' | 'dark'

const ThemeCtx = React.createContext<{ theme: Theme; toggle: () => void }>({ theme: 'light', toggle: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = React.useState<Theme>(() => {
    try {
      const saved = localStorage.getItem('si-theme')
      if (saved === 'dark' || saved === 'light') return saved
    } catch {
      /* ignore */
    }
    return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  })

  React.useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem('si-theme', theme)
    } catch {
      /* ignore */
    }
  }, [theme])

  const toggle = React.useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), [])

  return <ThemeCtx.Provider value={{ theme, toggle }}>{children}</ThemeCtx.Provider>
}

export function useTheme() {
  return React.useContext(ThemeCtx)
}
