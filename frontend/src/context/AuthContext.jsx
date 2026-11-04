import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { loginAdmin, refreshToken } from '@/services/authService'
import { session, tokenExpiry, UNAUTHORIZED_EVENT } from '@/services/http'

const AuthContext = createContext(null)

// FR-02: 30 dk hareketsizlikte oturum kapanır
const IDLE_TIMEOUT_MS = 30 * 60 * 1000
// Token bitimine bu süre kala ve kullanıcı aktifse token yenilenir
const REFRESH_BEFORE_MS = 5 * 60 * 1000
const CHECK_INTERVAL_MS = 30 * 1000
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart']

function readSession() {
  const token = session.token()
  const exp = token && tokenExpiry(token)
  if (!token || (exp && exp <= Date.now())) {
    session.clear()
    return { token: null, user: null }
  }
  return { token, user: session.user() }
}

export function AuthProvider({ children }) {
  const [state, setState] = useState(readSession)
  const lastActivity = useRef(0)
  const isAuthenticated = Boolean(state.token)

  const logout = useCallback(() => {
    session.clear()
    setState({ token: null, user: null })
  }, [])

  const login = useCallback(async (email, password, remember = true) => {
    const res = await loginAdmin({ email, password })
    session.save({ token: res.token, user: res.user }, remember)
    setState({ token: res.token, user: res.user })
  }, [])

  // Herhangi bir API çağrısı 401 dönerse oturumu kapat; ProtectedRoute girişe yönlendirir
  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, logout)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, logout)
  }, [logout])

  // Hareketsizlik takibi + aktif kullanıcı için token yenileme
  useEffect(() => {
    if (!isAuthenticated) return undefined
    lastActivity.current = Date.now()
    const onActivity = () => {
      lastActivity.current = Date.now()
    }
    ACTIVITY_EVENTS.forEach((e) => window.addEventListener(e, onActivity, { passive: true }))

    const timer = setInterval(async () => {
      const now = Date.now()
      if (now - lastActivity.current >= IDLE_TIMEOUT_MS) {
        logout()
        toast.info('30 dakika işlem yapılmadığı için oturumunuz kapatıldı.')
        return
      }
      const exp = tokenExpiry(session.token() ?? '')
      if (exp && exp - now <= REFRESH_BEFORE_MS) {
        try {
          const res = await refreshToken()
          session.updateToken(res.token)
          setState((s) => ({ ...s, token: res.token }))
        } catch {
          // 401 ise http.js oturumu zaten kapatır; ağ hatasında bir sonraki turda tekrar denenir
        }
      }
    }, CHECK_INTERVAL_MS)

    return () => {
      clearInterval(timer)
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, onActivity))
    }
  }, [isAuthenticated, logout])

  const value = useMemo(
    () => ({ token: state.token, user: state.user, isAuthenticated, login, logout }),
    [state, isAuthenticated, login, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth, AuthProvider içinde kullanılmalıdır.')
  return ctx
}
