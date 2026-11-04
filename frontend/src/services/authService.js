import { request } from './http'

/** POST /admin/auth/login -> { token, tokenType, expiresAt, user } */
export const loginAdmin = ({ email, password }) =>
  request('/admin/auth/login', { method: 'POST', body: { email, password }, auth: false })

/** POST /admin/auth/refresh — geçerli token ile yeni token alır */
export const refreshToken = () => request('/admin/auth/refresh', { method: 'POST' })

/** GET /admin/auth/me */
export const getCurrentUser = () => request('/admin/auth/me')
