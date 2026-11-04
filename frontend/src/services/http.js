const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'
const TOKEN_KEY = 'survey-tool.token'
const USER_KEY = 'survey-tool.user'

/** "Beni hatırla" seçiliyse localStorage, değilse sessionStorage (sekme kapanınca silinir). */
const activeStorage = () => (localStorage.getItem(TOKEN_KEY) != null ? localStorage : sessionStorage)

export const session = {
  token: () => sessionStorage.getItem(TOKEN_KEY) ?? localStorage.getItem(TOKEN_KEY),
  user: () => {
    try {
      return JSON.parse(activeStorage().getItem(USER_KEY))
    } catch {
      return null
    }
  },
  save: ({ token, user }, remember) => {
    session.clear()
    const storage = remember ? localStorage : sessionStorage
    storage.setItem(TOKEN_KEY, token)
    storage.setItem(USER_KEY, JSON.stringify(user))
  },
  updateToken: (token) => activeStorage().setItem(TOKEN_KEY, token),
  clear: () => {
    for (const s of [localStorage, sessionStorage]) {
      s.removeItem(TOKEN_KEY)
      s.removeItem(USER_KEY)
    }
  },
}

/** JWT'nin exp alanını (ms) okur; imza doğrulaması backend'de yapılır. */
export function tokenExpiry(token) {
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const { exp } = JSON.parse(atob(payload))
    return typeof exp === 'number' ? exp * 1000 : null
  } catch {
    return null
  }
}

export const UNAUTHORIZED_EVENT = 'survey-tool:unauthorized'

export class ApiError extends Error {
  constructor(message, status, data) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

async function parseBody(res) {
  const type = res.headers.get('content-type') ?? ''
  if (type.includes('application/json')) return res.json().catch(() => null)
  const text = await res.text().catch(() => '')
  return text || null
}

/**
 * Tüm API çağrıları buradan geçer.
 * @param {string} path  Örn. '/admin/surveys'
 * @param {{ method?: string, body?: any, headers?: Record<string,string>, auth?: boolean, raw?: boolean }} options
 */
export async function request(path, { method = 'GET', body, headers = {}, auth = true, raw = false } = {}) {
  const finalHeaders = { Accept: 'application/json', ...headers }
  if (body !== undefined && !(body instanceof FormData)) finalHeaders['Content-Type'] = 'application/json'
  const token = session.token()
  if (auth && token) finalHeaders.Authorization = `Bearer ${token}`

  let res
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: finalHeaders,
      body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
    })
  } catch {
    throw new ApiError('Sunucuya ulaşılamadı. Lütfen bağlantınızı kontrol edin.', 0, null)
  }

  if (!res.ok) {
    const data = await parseBody(res)
    if (res.status === 401 && auth) window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    const message =
      (data && typeof data === 'object' && data.message) ||
      (res.status === 401 ? 'Oturum geçersiz veya kullanıcı bilgileri hatalı.' : null) ||
      `İstek başarısız oldu (${res.status})`
    throw new ApiError(message, res.status, data)
  }

  if (raw) return res
  if (res.status === 204) return null
  return parseBody(res)
}

/** Dosya (CSV/PDF) indirir; dosya adı Content-Disposition başlığından alınır. */
export async function downloadFile(path, fallbackName) {
  const res = await request(path, { raw: true, headers: { Accept: '*/*' } })
  const disposition = res.headers.get('content-disposition') ?? ''
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition)
  const filename = match ? decodeURIComponent(match[1]) : fallbackName
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
