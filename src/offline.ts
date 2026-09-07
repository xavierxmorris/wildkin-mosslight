import { useCallback, useEffect, useRef, useState } from 'react'

export function useOffline() {
  const [status, setStatus] = useState<'loading' | 'ready' | 'unavailable' | 'development'>(import.meta.env.PROD ? 'loading' : 'development')
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null)
  const reloadRequested = useRef(false)

  useEffect(() => {
    if (!import.meta.env.PROD) return
    let mounted = true
    const cleanups: (() => void)[] = []
    const register = async () => {
      if (!('serviceWorker' in navigator)) {
        if (mounted) setStatus('unavailable')
        return
      }
      const registration = await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL })
      if (!mounted) return
      registrationRef.current = registration
      if (registration.active?.state === 'activated') setStatus('ready')
      if (registration.waiting) setUpdateAvailable(true)
      const watch = (worker: ServiceWorker) => {
        const changed = () => {
          if (!mounted) return
          if (worker.state === 'activated') setStatus('ready')
          if (worker.state === 'installed' && registration.active) setUpdateAvailable(true)
          if (worker.state === 'redundant' && !registration.active) {
            setStatus('unavailable')
            setError('Offline download did not finish. Reopen the game online to try again.')
          }
        }
        worker.addEventListener('statechange', changed)
        cleanups.push(() => worker.removeEventListener('statechange', changed))
      }
      const installing = () => { if (registration.installing) watch(registration.installing) }
      installing()
      registration.addEventListener('updatefound', installing)
      cleanups.push(() => registration.removeEventListener('updatefound', installing))
      const controllerChanged = () => {
        if (reloadRequested.current) window.location.reload()
        else if (mounted) setStatus('ready')
      }
      navigator.serviceWorker.addEventListener('controllerchange', controllerChanged)
      cleanups.push(() => navigator.serviceWorker.removeEventListener('controllerchange', controllerChanged))
    }
    void register().catch((reason: unknown) => {
      if (!mounted) return
      setStatus('unavailable')
      setError(reason instanceof Error ? `Offline loading is unavailable: ${reason.message}` : 'Offline loading is unavailable. You can still play while connected.')
    })
    return () => {
      mounted = false
      for (const cleanup of cleanups) cleanup()
    }
  }, [])

  const applyUpdate = useCallback(() => {
    const waiting = registrationRef.current?.waiting
    if (!waiting) {
      setError('That update is not ready yet. Keep playing and try again shortly.')
      return
    }
    reloadRequested.current = true
    waiting.postMessage({ type: 'ACTIVATE_UPDATE' })
  }, [])

  return { status, updateAvailable, error, applyUpdate }
}
