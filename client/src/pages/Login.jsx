import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../state/AuthContext.jsx'
import { createClient } from '../utils/api.js'
import GoogleLoginButton from '../components/GoogleLoginButton.jsx'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')
  const { login } = useAuth()
  const loc = useLocation()

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    try {
      const api = createClient()
      const { data } = await api.post('/auth/login', { email, password })
      login(data.token, data.user)
    } catch (e) {
      setErr(e?.response?.data?.error || 'Login failed')
    }
  }

  return (
    <div className="max-w-md mx-auto mt-12 card">
      <h1 className="text-2xl font-semibold mb-4">Welcome back</h1>
      {err && <div className="mb-3 text-red-300 text-sm">{err}</div>}
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label>Email</label>
          <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
        </div>
        <div>
          <label>Password</label>
          <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        </div>
        <button className="btn-primary w-full">Login</button>
      </form>
      <div className="my-3 h-px bg-white/10" />
      <GoogleLoginButton />
      <p className="mt-3 text-sm text-white/70">No account? <Link to="/signup" className="underline">Sign up</Link></p>
    </div>
  )
}
