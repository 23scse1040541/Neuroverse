import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../state/AuthContext.jsx'

export default function ProtectedRoute() {
  const { token, isExpired } = useAuth()
  const loc = useLocation()
  if (!token || isExpired()) return <Navigate to="/login" state={{ from: loc }} replace />
  return <Outlet />
}
