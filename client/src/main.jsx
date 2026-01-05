import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import ErrorBoundary from './ErrorBoundary.jsx'
import './styles/index.css'
import { AuthProvider } from './state/AuthContext.jsx'

const rootEl = document.getElementById('root')
try {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </React.StrictMode>
  )
} catch (e) {
  console.error('Neuroverse mount error:', e)
  if (rootEl) {
    rootEl.innerHTML = `<div style="padding:16px;background:#fee;color:#900;border:1px solid #fca;">
      <div style="font-weight:600;">Neuroverse failed to load</div>
      <div style="margin-top:8px;white-space:pre-wrap;">${(e && (e.stack||e.message||String(e)))}</div>
    </div>`
  }
}
