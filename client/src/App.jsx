import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Journal from './pages/Journal.jsx'
import Chatbot from './pages/Chatbot.jsx'
import Relax from './pages/Relax.jsx'
import Music from './pages/Music.jsx'
import Settings from './pages/Settings.jsx'
import Games from './pages/Games.jsx'
import { ThemeProvider, useTheme } from './state/ThemeContext.jsx'

function Shell(){
  const { theme, THEMES, LIGHT_THEMES, mode } = useTheme()
  const palette = mode === 'light' ? LIGHT_THEMES : THEMES
  const grad = palette[theme] || palette.default
  return (
    <div className={`min-h-screen bg-gradient-to-br ${grad} ${mode==='light'?'text-slate-900':'text-white'}`}>
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route element={<ProtectedRoute />}> 
            <Route path="/" element={<Dashboard />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/chatbot" element={<Chatbot />} />
            <Route path="/relax" element={<Relax />} />
            <Route path="/music" element={<Music />} />
            <Route path="/games" element={<Games />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App(){
  return (
    <ThemeProvider>
      <Shell />
    </ThemeProvider>
  )
}
