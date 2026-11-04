import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Basit veri çekme kancası.
 * @param {() => Promise<any>} fn  Veriyi getiren fonksiyon
 * @param {any[]} deps  Değiştiğinde yeniden çeker
 */
export function useFetch(fn, deps = []) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  const fnRef = useRef(fn)
  fnRef.current = fn

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }))
    try {
      const data = await fnRef.current()
      setState({ data, error: null, loading: false })
    } catch (error) {
      setState({ data: null, error, loading: false })
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { ...state, reload: load }
}
