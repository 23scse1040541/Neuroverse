import React, { useEffect, useRef } from 'react'
import { createClient } from '../utils/api'
import { useAuth } from '../state/AuthContext.jsx'

export default function GoogleLoginButton(){
  const divRef = useRef(null)
  const { login } = useAuth()

  useEffect(()=>{
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId || !window.google || !divRef.current) return
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async (resp) => {
        try {
          const api = createClient()
          const { data } = await api.post('/auth/google', { idToken: resp.credential })
          login(data.token, data.user)
        } catch (e) {
          alert('Google login failed')
        }
      },
    })
    window.google.accounts.id.renderButton(divRef.current, { theme: 'outline', size: 'large', width: 320 })
  },[])

  return <div className="mt-3" ref={divRef} />
}
