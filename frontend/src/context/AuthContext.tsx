import { createContext, useContext, useState, type ReactNode } from 'react'
import { USERS, type User } from '../data/mockData.ts'

type AuthUser = Omit<User, 'password'>

interface AuthContextValue {
  user: AuthUser | null
  login: (email: string, password: string) => AuthUser
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem('fb_user')
    return stored ? (JSON.parse(stored) as AuthUser) : null
  })

  function login(email: string, password: string): AuthUser {
    const found = USERS.find(u => u.email === email && u.password === password)
    if (!found) throw new Error('Email hoặc mật khẩu không đúng.')
    const { password: _pw, ...safe } = found
    setUser(safe)
    localStorage.setItem('fb_user', JSON.stringify(safe))
    return safe
  }

  function logout() {
    setUser(null)
    localStorage.removeItem('fb_user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
