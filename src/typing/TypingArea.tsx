import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { SessionState } from '../engine'
import { Speaker } from './Speaker'
import type { Step } from './steps'
import { Thinking } from './Thinking'
import type { Token } from './tokens'
import { endsLineAlways, tokenize } from './tokens'

/** Newlines and tabs have to be visible on the single line of key hints. */
function visible(keys: string): string {
  return keys.replaceAll('\n', '⏎').replaceAll('\t', '⇥')
}

const HINT_TAIL = 24
const HINT_HEAD = 36

export type Mood = 'idle' | 'error' | 'cleared'

const NO_ENDS: ReadonlySet<number> = new Set()

function sameSet(left: ReadonlySet<number>, right: ReadonlySet<number>): boolean {
  if (left.size !== right.size) return false
  for (const value of left) if (!right.has(value)) return false
  return true
}

/**
 * Finds the spaces that wrapping left at the end of a line. The text after one
 * starts lower than the space does. The marks drawn for them take no width, so
 * marking a space never moves where the text wraps.
 */
function softLineEnds(root: HTMLElement): ReadonlySet<number> {
  const spans = [...root.querySelectorAll<HTMLElement>('[data-start]')]
  const ends = new Set<number>()
  spans.forEach((span, index) => {
    if (span.dataset.kind !== 'space') return
    const following = spans[index + 1]?.getClientRects()[0]
    const own = span.getBoundingClientRect()
    if (following !== undefined && following.top > own.top + own.height / 2) {
      ends.add(Number(span.dataset.start))
    }
  })
  return ends
}

interface RunProps {
  readonly tokens: readonly Token[]
  readonly target: string
  readonly softEnds: ReadonlySet<number>
}

/** Draws tokens with a mark on every newline and on every space that ends a line. */
function Run({ tokens, target, softEnds }: RunProps) {
  return tokens.map((token) => {
    if (token.kind === 'text') {
      return (
        <span key={token.start} data-start={token.start}>
          {token.text}
        </span>
      )
    }
    const endsLine =
      token.kind === 'space' && (endsLineAlways(target, token.start) || softEnds.has(token.start))
    return (
      <span
        key={token.start}
        data-start={token.start}
        data-kind={token.kind}
        data-eol={endsLine ? '' : undefined}
        className={token.kind}
      >
        {token.text}
      </span>
    )
  })
}

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
  const caret = useRef<HTMLSpanElement>(null)
  const area = useRef<HTMLPreElement>(null)
  const [softEnds, setSoftEnds] = useState(NO_ENDS)

  // A long code block can outgrow the viewport. Keep the caret in sight rather
  // than asking the typist to scroll while they type.
  useEffect(() => {
    caret.current?.scrollIntoView({ block: 'nearest' })
  }, [state.committed])

  // Where the text wraps depends on the width, so it is measured after layout
  // and again whenever the box is resized.
  useLayoutEffect(() => {
    const root = area.current
    if (root === null) return undefined
    const measure = () => {
      const ends = softLineEnds(root)
      setSoftEnds((previous) => (sameSet(previous, ends) ? previous : ends))
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(measure)
    observer.observe(root)
    return () => {
      observer.disconnect()
    }
  }, [step.target, state.committed])

  const showsReading = step.block.reading !== null
  const monospaced = step.block.kind !== 'text'
  const progress = step.target.length === 0 ? 0 : state.committed / step.target.length

  return (
    <div className="typing" data-mood={mood}>
      <div className="typing-rail" style={{ transform: `scaleX(${String(progress)})` }} />
      <div className="typing-head">
        <Speaker who="assistant" />
        <Thinking active={!state.done} remaining={state.remaining.length} />
      </div>
      {showsReading ? <p className="typing-display">{step.block.body}</p> : null}
      <pre ref={area} className={monospaced ? 'typing-target is-code' : 'typing-target'}>
        <span className="is-done">
          <Run
            tokens={tokenize(step.target.slice(0, state.committed))}
            target={step.target}
            softEnds={softEnds}
          />
        </span>
        <span className="caret" ref={caret} />
        <span className="is-rest">
          <Run
            tokens={tokenize(step.target.slice(state.committed), state.committed)}
            target={step.target}
            softEnds={softEnds}
          />
        </span>
      </pre>
      <p className="typing-keys">
        <span className="is-done">{visible(state.typed.slice(-HINT_TAIL))}</span>
        <span className="caret" />
        <span className="is-rest">{visible(state.remaining.slice(0, HINT_HEAD))}</span>
      </p>
    </div>
  )
}
