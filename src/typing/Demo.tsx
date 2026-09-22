import { useEffect, useMemo, useState } from 'react'
import type { SessionState } from '../engine'
import { TypingSession } from '../engine'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

const STEP_MS = 55
const HOLD_MS = 1800
const LEAD_MS = 600

interface DemoProps {
  /** What the reader sees, kanji and all. */
  readonly body: string
  /** What gets typed. */
  readonly target: string
}

/**
 * Types itself, on a loop, through the same engine the trainer uses. It is the
 * shortest way to say what this place is.
 */
export function Demo({ body, target }: DemoProps) {
  const still = usePrefersReducedMotion()
  const [live, setLive] = useState<SessionState>(() => new TypingSession(target).state)

  // Nobody who asked for less movement wants a line that types itself, so they
  // get the finished thing. Deriving it beats animating and then stopping.
  const settled = useMemo(() => {
    if (!still) return null
    const session = new TypingSession(target)
    for (const key of session.state.remaining) session.press(key)
    return session.state
  }, [still, target])

  useEffect(() => {
    if (still) return undefined
    const session = new TypingSession(target)
    let timer = 0
    const tick = (): void => {
      const next = session.state.remaining[0]
      if (next === undefined) {
        timer = window.setTimeout(() => {
          session.reset()
          setLive(session.state)
          timer = window.setTimeout(tick, STEP_MS)
        }, HOLD_MS)
        return
      }
      session.press(next)
      setLive(session.state)
      timer = window.setTimeout(tick, STEP_MS)
    }

    timer = window.setTimeout(tick, LEAD_MS)
    return () => {
      window.clearTimeout(timer)
    }
  }, [target, still])

  const state = settled ?? live

  return (
    <div className="demo" aria-hidden="true">
      <p className="demo-body">{body}</p>
      <p className="demo-target">
        <span className="is-done">{target.slice(0, state.committed)}</span>
        <span className="caret" />
        <span className="is-rest">{target.slice(state.committed)}</span>
      </p>
      <p className="demo-keys">
        <span className="is-done">{state.typed}</span>
        <span className="is-rest">{state.remaining}</span>
      </p>
    </div>
  )
}
