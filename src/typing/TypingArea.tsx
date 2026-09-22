import type { SessionState } from '../engine'
import type { Step } from './steps'

/** Newlines have to be visible on the single line of key hints. */
function visible(keys: string): string {
  return keys.replaceAll('\n', '⏎')
}

const HINT_TAIL = 24
const HINT_HEAD = 36

export type Mood = 'idle' | 'error' | 'cleared'

interface TypingAreaProps {
  readonly step: Step
  readonly state: SessionState
  readonly mood: Mood
}

/**
 * Shows the live target. This holds no engine of its own: the player owns one
 * per step, so a key never falls between two of them.
 */
export function TypingArea({ step, state, mood }: TypingAreaProps) {
  const showsReading = step.block.reading !== null
  const monospaced = step.block.kind !== 'text'
  const progress = step.target.length === 0 ? 0 : state.committed / step.target.length

  return (
    <div className="typing" data-mood={mood}>
      <div className="typing-rail" style={{ transform: `scaleX(${String(progress)})` }} />
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
