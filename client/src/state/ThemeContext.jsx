import React, { createContext, useContext, useMemo, useState } from 'react'

const ThemeCtx = createContext(null)

const THEMES = {
  default: 'from-primary-900 via-primary-700 to-tealish',
  calm: 'from-sky-900 via-indigo-800 to-teal-600',
  focus: 'from-slate-900 via-slate-800 to-cyan-700',
  happy: 'from-fuchsia-900 via-purple-700 to-pink-600',
  sad: 'from-slate-950 via-blue-900 to-slate-700',
  anxious: 'from-rose-900 via-orange-800 to-amber-700',
}

const LIGHT_THEMES = {
  default: 'from-indigo-100 via-teal-100 to-sky-100',
  calm: 'from-sky-100 via-indigo-100 to-teal-100',
  focus: 'from-slate-100 via-slate-200 to-cyan-100',
  happy: 'from-fuchsia-100 via-purple-100 to-pink-100',
  sad: 'from-blue-100 via-slate-100 to-blue-50',
  anxious: 'from-orange-100 via-amber-100 to-rose-100',
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('default')
  const [mode, setMode] = useState('dark') // 'dark' | 'light'
  const toggleMode = () => setMode(m => (m === 'dark' ? 'light' : 'dark'))
  const value = useMemo(()=>({ theme, setTheme, THEMES, LIGHT_THEMES, mode, toggleMode }),[theme, mode])
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>
}

export function useTheme(){ return useContext(ThemeCtx) }
