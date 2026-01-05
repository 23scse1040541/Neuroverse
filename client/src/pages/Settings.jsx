import React from 'react'
import { useAuth } from '../state/AuthContext.jsx'
import { createClient } from '../utils/api.js'

export default function Settings() {
  const { token, logout } = useAuth()
  const api = createClient(()=>token)

  const deleteMe = async () => {
    if (!confirm('Delete your account and all data? This cannot be undone.')) return
    try {
      await api.delete('/user/me')
      logout()
    } catch {}
  }

  const acceptConsent = async () => {
    try { await api.post('/user/consent'); alert('Consent recorded.') } catch {}
  }

  return (
    <div className="card max-w-xl">
      <h2 className="text-lg font-semibold mb-2">Settings</h2>
      <div className="space-y-3">
        <button className="btn-secondary" onClick={acceptConsent}>Record Consent</button>
        <button className="btn bg-red-500 hover:bg-red-400" onClick={deleteMe}>Delete Account</button>
      </div>
    </div>
  )
}
