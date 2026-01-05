import React, { useState } from 'react'
import { useAuth } from '../state/AuthContext.jsx'
import { createClient } from '../utils/api.js'

export default function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [consent, setConsent] = useState(false)
  const [err, setErr] = useState('')
  const { login } = useAuth()

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    try {
      const api = createClient()
      const { data } = await api.post('/auth/signup', { email, password, name, consent })
      login(data.token, data.user)
    } catch (e) {
      setErr(e?.response?.data?.error || 'Signup failed')
    }
  }

  return (
    <div className="max-w-md mx-auto mt-12 card">
      <h1 className="text-2xl font-semibold mb-4">Create account</h1>
      {err && <div className="mb-3 text-red-300 text-sm">{err}</div>}
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label>Name</label>
          <input className="input" value={name} onChange={e=>setName(e.target.value)} />
        </div>
        <div>
          <label>Email</label>
          <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
        </div>
        <div>
          <label>Password</label>
          <input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        </div>
        <label className="flex items-center gap-2"><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} /> I consent to data processing as described.</label>
        <button className="btn-primary w-full">Sign Up</button>
      </form>
    </div>
  )
}
