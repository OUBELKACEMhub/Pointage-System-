import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('zk_theme')
    return saved ? saved === 'dark' : false
  })

  useEffect(() => {
    localStorage.setItem('zk_theme', dark ? 'dark' : 'light')
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
  }, [dark])

  const toggle = () => setDark(d => !d)

  // Design tokens
  const t = dark ? {
    bg:          '#0d1117',
    surface:     '#161b22',
    surfaceHover:'#1c2128',
    border:      '#30363d',
    borderFocus: '#6366f1',
    text:        '#e6edf3',
    textMuted:   '#8b949e',
    textFaint:   '#484f58',
    primary:     '#818cf8',
    primaryBg:   'rgba(129,140,248,0.12)',
    primaryBorder:'rgba(129,140,248,0.3)',
    green:       '#3fb950',
    greenBg:     'rgba(63,185,80,0.12)',
    amber:       '#d29922',
    amberBg:     'rgba(210,153,34,0.12)',
    red:         '#f85149',
    redBg:       'rgba(248,81,73,0.12)',
    badge: {
      present: { bg:'rgba(63,185,80,0.12)',  color:'#3fb950', dot:'#3fb950' },
      late:    { bg:'rgba(210,153,34,0.12)', color:'#d29922', dot:'#d29922' },
      absent:  { bg:'rgba(248,81,73,0.12)',  color:'#f85149', dot:'#f85149' },
    },
  } : {
    bg:          '#f1f5f9',
    surface:     '#ffffff',
    surfaceHover:'#f8fafc',
    border:      '#e2e8f0',
    borderFocus: '#6366f1',
    text:        '#0f172a',
    textMuted:   '#64748b',
    textFaint:   '#94a3b8',
    primary:     '#6366f1',
    primaryBg:   'rgba(99,102,241,0.08)',
    primaryBorder:'rgba(99,102,241,0.25)',
    green:       '#16a34a',
    greenBg:     'rgba(22,163,74,0.08)',
    amber:       '#d97706',
    amberBg:     'rgba(217,119,6,0.08)',
    red:         '#dc2626',
    redBg:       'rgba(220,38,38,0.08)',
    badge: {
      present: { bg:'rgba(22,163,74,0.10)',  color:'#16a34a', dot:'#16a34a' },
      late:    { bg:'rgba(217,119,6,0.10)',  color:'#d97706', dot:'#d97706' },
      absent:  { bg:'rgba(220,38,38,0.10)', color:'#dc2626', dot:'#dc2626' },
    },
  }

  return (
    <ThemeContext.Provider value={{ dark, toggle, t }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
