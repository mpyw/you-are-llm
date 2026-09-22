import { useEffect, useState } from 'react'

const QUERY = '(prefers-reduced-motion: reduce)'

function query(): MediaQueryList | null {
  try {
    return globalThis.matchMedia(QUERY)
  } catch {
    // Not every environment implements media queries, jsdom among them.
    return null
  }
}

/** Whether the viewer asked for less movement, including a change of mind. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => query()?.matches ?? false)

  useEffect(() => {
    const list = query()
    if (list === null) return undefined
    const onChange = (event: MediaQueryListEvent): void => {
      setReduced(event.matches)
    }
    list.addEventListener('change', onChange)
    return () => {
      list.removeEventListener('change', onChange)
    }
  }, [])

  return reduced
}
