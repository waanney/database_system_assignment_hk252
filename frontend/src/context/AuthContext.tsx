import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import { authApi, type User, type RegisterData, getErrorMessage } from '../services/api'

interface AuthContextValue {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  isLoading: boolean
  isInitialized: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [isLoading, setIsLoading] = useState(false)
  // Prevent rendering private routes until the initial profile fetch completes.
  // This avoids hydration mismatches when a token exists in localStorage but
  // the user object hasn't been loaded from the API yet.
  const [isInitialized, setIsInitialized] = useState(false)

  // Navigate to login when auth fails
  const navigateToLogin = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
    window.location.href = '/login'
  }

  // Fetch user profile from API when app loads with existing token
  const fetchUserProfile = useCallback(async () => {
    const storedToken = localStorage.getItem('token') || localStorage.getItem('auth_token')
    if (!storedToken) {
      setIsInitialized(true)
      return
    }

    try {
      const response = await authApi.getMe()
      const userData = response.data
      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))
    } catch {
      // Token invalid or expired — clear everything and redirect to login
      navigateToLogin()
    } finally {
      setIsInitialized(true)
    }
  }, [])

  // Always fetch fresh user profile on mount if token exists
  useEffect(() => {
    if (localStorage.getItem('token')) {
      fetchUserProfile()
    } else {
      setIsInitialized(true)
    }
  }, [fetchUserProfile])

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await authApi.login(email, password)
      const { access_token } = response.data
      setToken(access_token)
      localStorage.setItem('token', access_token)
      localStorage.setItem('auth_token', access_token)

      // Fetch user profile from API
      const userResponse = await authApi.getMe()
      const userData = userResponse.data
      setUser(userData)
      localStorage.setItem('user', JSON.stringify(userData))
    } catch (error) {
      localStorage.removeItem('token')
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      setToken(null)
      setUser(null)
      throw new Error(getErrorMessage(error))
    } finally {
      setIsLoading(false)
    }
  }, [])

  const register = useCallback(async (data: RegisterData) => {
    setIsLoading(true)
    try {
      await authApi.register(data)
    } catch (error) {
      const message = getErrorMessage(error)
      throw new Error(typeof message === 'string' ? message : 'Registration failed.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading, isInitialized }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
