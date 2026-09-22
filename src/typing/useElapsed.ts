import { useEffect, useState } from 'react'

const TICK_MS = 100

/** Milliseconds since `startedAt`, frozen once `finishedAt` is set. */
export function useElapsed(startedAt: number | null, finishedAt: number | null): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (startedAt === null || finishedAt !== null) return undefined
    const timer = window.setInterval(() => {
      setNow(Date.now())
    }, TICK_MS)
    return () => {
      window.clearInterval(timer)
    }
  }, [startedAt, finishedAt])

  if (startedAt === null) return 0
  return (finishedAt ?? now) - startedAt
}
