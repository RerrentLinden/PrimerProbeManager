import { useState, useEffect, useCallback } from 'react'
import { AUTH_TOKEN_KEY } from '@/api/client'
import { verifyToken } from '@/api/auth'

interface AuthState {
  readonly isAuthenticated: boolean
  readonly isLoading: boolean
  readonly logout: () => void
}

export function useAuth(): AuthState {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY)
    if (!token) {
      setIsLoading(false)
      return
    }
    verifyToken()
      .then(() => setIsAuthenticated(true))
      .catch(() => {
        localStorage.removeItem(AUTH_TOKEN_KEY)
        setIsAuthenticated(false)
      })
      .finally(() => setIsLoading(false))
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_TOKEN_KEY)
    setIsAuthenticated(false)
  }, [])

  return { isAuthenticated, isLoading, logout }
}
