import React, { createContext, useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { jwtDecode } from 'jwt-decode'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('nv_token') || '')
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('nv_user')
    return raw ? JSON.parse(raw) : null
  })
  const navigate = useNavigate()

  useEffect(() => {
    if (token) localStorage.setItem('nv_token', token); else localStorage.removeItem('nv_token')
    if (user) localStorage.setItem('nv_user', JSON.stringify(user)); else localStorage.removeItem('nv_user')
  }, [token, user])

  const login = (t, u) => { setToken(t); setUser(u); navigate('/') }
  const logout = () => { setToken(''); setUser(null); navigate('/login') }

  const isExpired = () => {
    if (!token) return true
    try { const { exp } = jwtDecode(token); return exp * 1000 < Date.now() } catch { return true }
  }

  return (
    <AuthCtx.Provider value={{ token, user, login, logout, isExpired }}>
      {children}
    </AuthCtx.Provider>
  )
}

export function useAuth() { return useContext(AuthCtx) }
