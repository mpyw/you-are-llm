import { useEffect, useMemo, useRef, useState } from 'react'
import type { SessionState } from '../engine'
import { TypingSession } from '../engine'
import type { Step } from './steps'

/** Newlines have to be visible on the single line of key hints. */
function visible(keys: string): string {
  return keys.replaceAll('\n', '\u23ce')
}

const FLASH_MS = 160
const HINT_TAIL = 24
const HINT_HEAD = 36

interface TypingAreaProps {
  readonly step: Step
  /** Called after every key, accepted or not. */
  readonly onChange: (state: SessionState) => void
}

/**
 * The live target for one step. Mount this with a key per step so each step
 * starts from a fresh engine.
 */
export function TypingArea({ step, onChange }: TypingAreaProps) {
  const typing = useMemo(() => new TypingSession(step.target), [step.target])
  const [state, setState] = useState<SessionState>(() => typing.state)
  const [flashing, setFlashing] = useState(false)

  const onChangeRef = useRef(onChange)
  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const key = event.key === 'Enter' ? '\n' : event.key
      if (key.length !== 1) return
      event.preventDefault()
      const accepted = typing.press(key)
      setFlashing(!accepted)
      const next = typing.state
      setState(next)
      onChangeRef.current(next)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [typing])

  useEffect(() => {
    if (!flashing) return undefined
    const timer = window.setTimeout(() => {
      setFlashing(false)
    }, FLASH_MS)
    return () => {
      window.clearTimeout(timer)
    }
  }, [flashing])

  const showsReading = step.block.reading !== null
  const monospaced = step.block.kind !== 'text'

  return (
    <div className="typing" data-flash={flashing ? 'on' : 'off'}>
      {showsReading ? <p className="typing-display">{step.block.body}</p> : null}
      <pre className={monospaced ? 'typing-target is-code' : 'typing-target'}>
        <span className="is-done">{step.target.slice(0, state.committed)}</span>
        <span className="caret" />
        <span className="is-rest">{step.target.slice(state.committed)}</span>
      </pre>
      <p className="typing-keys">
        <span className="is-done">{visible(state.typed.slice(-HINT_TAIL))}</span>
        <span className="caret" />
        <span className="is-rest">{visible(state.remaining.slice(0, HINT_HEAD))}</span>
      </p>
    </div>
  )
}
