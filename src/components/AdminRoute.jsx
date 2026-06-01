import { Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import supabase from '../services/supabase'

export default function AdminRoute({ children }) {
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const role = data?.user?.user_metadata?.role
      setStatus(role === 'admin' ? 'ok' : 'denied')
    })
  }, [])

  if (status === 'loading') return null
  if (status === 'denied') return <Navigate to="/home" />
  return children
}