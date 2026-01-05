import React, { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../state/AuthContext.jsx'
import { useTheme } from '../state/ThemeContext.jsx'
import { Sun, Moon, Palette } from 'lucide-react'

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/journal', label: 'Journal' },
  { to: '/chatbot', label: 'Chatbot' },
  { to: '/relax', label: 'Relax' },
  { to: '/music', label: 'Music' },
  { to: '/games', label: 'Games' },
  { to: '/settings', label: 'Settings' },
]

export default function Navbar() {
  const { logout, token } = useAuth()
  const [open, setOpen] = useState(false)
  const { theme, setTheme, mode, toggleMode } = useTheme()
  const cycleTheme = () => {
    const order = ['default','calm','focus','happy','sad','anxious']
    const i = order.indexOf(theme)
    setTheme(order[(i+1)%order.length])
  }
  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-primary-900/80 via-primary-800/70 to-tealish/40 backdrop-blur border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-tealish">Neuroverse</Link>
        <button className="md:hidden btn-secondary px-3 py-1" onClick={()=>setOpen(o=>!o)} aria-label="Toggle navigation">Menu</button>
        <nav className="hidden md:flex gap-1">
          {token && navItems.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({isActive})=>`px-3 py-2 rounded-lg transition font-medium ${isActive?'bg-white/20 text-white shadow':'text-white/80 hover:text-white hover:bg-white/10'}`}
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden md:flex items-center gap-2">
          <button className="btn-secondary px-2" title={`Switch to ${mode==='dark'?'light':'dark'} mode`} onClick={toggleMode}>
            {mode==='dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button className="btn-secondary px-2" title="Change theme" onClick={cycleTheme}>
            <Palette size={16} />
          </button>
          {!token ? (
            <>
              <Link to="/login" className="btn-secondary">Login</Link>
              <Link to="/signup" className="btn-primary">Sign Up</Link>
            </>
          ) : (
            <button onClick={logout} className="btn-secondary">Logout</button>
          )}
        </div>
      </div>
      {token && open && (
        <div className="md:hidden px-4 pb-3 flex flex-col gap-1 border-t border-white/10 bg-primary-900/70">
          {navItems.map(n => (
            <NavLink key={n.to} to={n.to} onClick={()=>setOpen(false)} className={({isActive})=>`px-3 py-2 rounded-lg ${isActive?'bg-white/20 text-white':'text-white/80 hover:text-white hover:bg-white/10'}`}>{n.label}</NavLink>
          ))}
          <div className="pt-2">
            <div className="flex gap-2 mb-2">
              <button className="btn-secondary flex-1" onClick={toggleMode}>{mode==='dark'?'Light mode':'Dark mode'}</button>
              <button className="btn-secondary flex-1" onClick={cycleTheme}>Change theme</button>
            </div>
            {!token ? (
              <div className="flex gap-2">
                <Link to="/login" className="btn-secondary flex-1" onClick={()=>setOpen(false)}>Login</Link>
                <Link to="/signup" className="btn-primary flex-1" onClick={()=>setOpen(false)}>Sign Up</Link>
              </div>
            ) : (
              <button onClick={()=>{setOpen(false); logout()}} className="btn-secondary w-full">Logout</button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
