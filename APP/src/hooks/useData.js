/**
 * Data-fetching hook with explicit loading / error / reload states.
 *
 * - Key change (endpoint / params / data source): previous data is cleared
 *   during render (React's "store information from previous renders" pattern)
 *   so stale data from another source never flashes on screen.
 * - reload(): stale-while-revalidate — current data stays visible while the
 *   new request is in flight; loading/error reflect the in-flight request.
 *
 * @param {(signal: AbortSignal) => Promise<any>} fetcher
 * @param {string} key  identity of the request (endpoint + params + source)
 */
import { useCallback, useEffect, useRef, useState } from 'react'

export function useData(fetcher, key = 'default') {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const [nonce, setNonce] = useState(0)
  const [lastKey, setLastKey] = useState(key)
  const fetcherRef = useRef(fetcher)

  useEffect(() => {
    fetcherRef.current = fetcher
  }, [fetcher])

  if (lastKey !== key) {
    setLastKey(key)
    setState({ data: null, loading: true, error: null })
  }

  useEffect(() => {
    let alive = true
    const controller = new AbortController()
    fetcherRef.current(controller.signal)
      .then((data) => {
        if (alive) setState({ data, loading: false, error: null })
      })
      .catch((error) => {
        if (!alive || error?.name === 'AbortError') return
        setState({ data: null, loading: false, error })
      })
    return () => {
      alive = false
      controller.abort()
    }
  }, [key, nonce])

  const reload = useCallback(() => {
    setState((s) => ({ ...s, loading: true, error: null }))
    setNonce((n) => n + 1)
  }, [])

  return { ...state, reload }
}
