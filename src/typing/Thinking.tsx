import { useEffect, useState } from 'react'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

/**
 * A nod to the spinners every coding agent shows while it works. The frames are
 * the braille cycle that command line tools have used for years, and the words
 * are this project's own.
 */
const FRAMES = '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'

const VERBS = [
  'Thinking',
  'Deliberating',
  'Weighing the tradeoffs',
  'Consulting the source of truth',
  'Rereading the prompt',
  'Second guessing itself',
  'Drafting a retraction',
  'Checking that again',
] as const

const FRAME_MS = 90
const VERB_MS = 2600

interface ThinkingProps {
  readonly active: boolean
  /** Keys still to type in this block. */
  readonly remaining: number
}

export function Thinking({ active, remaining }: ThinkingProps) {
  const still = usePrefersReducedMotion()
  const [frame, setFrame] = useState(0)
  const [verb, setVerb] = useState(0)

  useEffect(() => {
    if (!active || still) return undefined
    const spin = window.setInterval(() => {
      setFrame((at) => (at + 1) % FRAMES.length)
    }, FRAME_MS)
    const words = window.setInterval(() => {
      setVerb((at) => (at + 1) % VERBS.length)
    }, VERB_MS)
    return () => {
      window.clearInterval(spin)
      window.clearInterval(words)
    }
  }, [active, still])

  return (
    <p className="thinking" data-active={active}>
      <span className="thinking-spinner" aria-hidden="true">
        {active ? FRAMES[frame] : '✓'}
      </span>
      <span className="thinking-verb" data-still={still}>
        {active ? `${VERBS[verb] ?? VERBS[0]}…` : 'Done'}
      </span>
      {active ? <span className="thinking-left">{remaining} left</span> : null}
    </p>
  )
}
