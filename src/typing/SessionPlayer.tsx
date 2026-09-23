import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { soundBoard } from '../audio/SoundBoard'
import type { SessionState } from '../engine'
import { TypingSession } from '../engine'
import type { Block, Session } from '../materials'
import { CODE_LANGUAGE_LABELS, DIFFICULTY_LABELS } from '../materials'
import { Burst } from './Burst'
import { Hud } from './Hud'
import { ShareRow } from './ShareRow'
import type { ShareCard } from './share'
import { Speaker } from './Speaker'
import type { Mood } from './TypingArea'
import { TypingArea } from './TypingArea'
import type { Rank, Tally } from './stats'
import { accuracy, formatDuration, keysPerMinute, rank } from './stats'
import type { Step } from './steps'
import { toSteps } from './steps'
import { useElapsed } from './useElapsed'

/** A combo worth hearing about. */
const COMBO_STEP = 25

/** How long the panel stays angry after a rejected key. */
const FLASH_MS = 180

interface Progress {
  readonly index: number
  readonly accepted: number
  readonly mistakes: number
  readonly combo: number
  readonly bestCombo: number
  /** Counts finished blocks, which is what replays the burst. */
  readonly clears: number
  readonly startedAt: number | null
  readonly finishedAt: number | null
}

const START: Progress = {
  index: 0,
  accepted: 0,
  mistakes: 0,
  combo: 0,
  bestCombo: 0,
  clears: 0,
  startedAt: null,
  finishedAt: null,
}

export function SessionPlayer({ session }: { readonly session: Session }) {
  const steps = useMemo(() => toSteps(session), [session])
  // One engine per step, built up front. Keys then always have somewhere to go,
  // even in the moment between finishing a block and drawing the next one.
  const engines = useMemo(() => steps.map((step) => new TypingSession(step.target)), [steps])

  // Keys can arrive faster than React re-renders, so the running totals live in
  // a ref and the state only mirrors them. Reading them from a closure would
  // let one burst of typing overwrite the key before it.
  const running = useRef<Progress>(START)
  const [progress, setProgress] = useState<Progress>(START)
  const [state, setState] = useState<SessionState | null>(() => engines[0]?.state ?? null)
  const [mood, setMood] = useState<Mood>('idle')
  const elapsedMs = useElapsed(progress.startedAt, progress.finishedAt)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const key = event.key === 'Enter' ? '\n' : event.key === 'Tab' ? '\t' : event.key
      if (key.length !== 1) return

      const current = running.current
      const engine = engines[current.index]
      if (engine === undefined) return

      // Tab belongs to the page unless the session is waiting on an indent, so
      // it goes on moving focus rather than being counted as a mistake.
      if (key === '\t' && !engine.state.nextKeys.includes('\t')) return

      event.preventDefault()
      const now = Date.now()
      const startedAt = current.startedAt ?? now
      const accepted = engine.press(key)
      const engineState = engine.state
      let next: Progress

      if (!accepted) {
        soundBoard.play('miss')
        setMood('error')
        next = { ...current, startedAt, combo: 0, mistakes: current.mistakes + 1 }
      } else {
        const combo = current.combo + 1
        const landed = {
          ...current,
          startedAt,
          combo,
          bestCombo: Math.max(current.bestCombo, combo),
          accepted: current.accepted + 1,
        }
        if (engineState.done) {
          const index = current.index + 1
          const over = index >= steps.length
          soundBoard.play(over ? 'finish' : 'clear')
          setMood('cleared')
          next = { ...landed, index, clears: current.clears + 1, finishedAt: over ? now : null }
        } else {
          soundBoard.play(combo % COMBO_STEP === 0 ? 'combo' : 'key', combo)
          setMood('idle')
          next = landed
        }
      }

      running.current = next
      setProgress(next)
      setState(engines[next.index]?.state ?? engineState)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [engines, steps.length])

  useEffect(() => {
    if (mood !== 'error') return undefined
    const timer = window.setTimeout(() => {
      setMood('idle')
    }, FLASH_MS)
    return () => {
      window.clearTimeout(timer)
    }
  }, [mood])

  const restart = useCallback(() => {
    for (const engine of engines) engine.reset()
    running.current = START
    setProgress(START)
    setState(engines[0]?.state ?? null)
    setMood('idle')
  }, [engines])

  const done = progress.index >= steps.length
  const step = steps[progress.index]
  const tally: Tally = { accepted: progress.accepted, mistakes: progress.mistakes, elapsedMs }

  return (
    <article className="player">
      <header className="player-head">
        <div className="player-title">
          <h1>{session.title}</h1>
          <p className="tags">
            <span className="badge">{CODE_LANGUAGE_LABELS[session.codeLanguage]}</span>
            <span className={`badge is-${session.difficulty}`}>
              {DIFFICULTY_LABELS[session.difficulty]}
            </span>
            <span className="badge">{session.language}</span>
          </p>
        </div>
        <Hud
          combo={progress.combo}
          bestCombo={progress.bestCombo}
          tally={tally}
          step={progress.index}
          total={steps.length}
        />
        <ProgressBar current={progress.index} total={steps.length} />
      </header>

      <div className="player-body">
        {/* The stage comes first in the source so a narrow screen puts it on
            top. On a wide one the grid moves the source file back to the left. */}
        <section className="stage-column">
          {done || step === undefined || state === null ? (
            <Result
              title={session.title}
              codeLanguage={CODE_LANGUAGE_LABELS[session.codeLanguage]}
              difficulty={DIFFICULTY_LABELS[session.difficulty]}
              tally={tally}
              bestCombo={progress.bestCombo}
              onRestart={restart}
            />
          ) : (
            /* Keyed by step so each one animates in rather than growing the page. */
            <div className="stage" key={progress.index}>
              <p className="prompt">
                <Speaker who="human" />
                {step.prompt}
              </p>
              <TypingArea step={step} state={state} mood={mood} />
              <Burst trigger={progress.clears} />
            </div>
          )}
          <Log steps={steps} done={progress.index} />
        </section>

        <aside className="context">
          {session.files.map((file) => (
            <section key={file.path}>
              <h2>{file.path}</h2>
              <pre>{file.content}</pre>
            </section>
          ))}
        </aside>
      </div>
    </article>
  )
}

/** Everything already typed, folded away so it never pushes the stage down. */
function Log({ steps, done }: { readonly steps: readonly Step[]; readonly done: number }) {
  if (done === 0) return null
  return (
    <details className="log">
      <summary>
        {done} block{done === 1 ? '' : 's'} typed
      </summary>
      <div className="log-body">
        {steps.slice(0, done).map((step) => (
          <Fragment key={`${String(step.turnIndex)}:${String(step.blockIndex)}`}>
            {step.blockIndex === 0 ? (
              <p className="prompt is-past">
                <Speaker who="human" />
                {step.prompt}
              </p>
            ) : null}
            <CompletedBlock block={step.block} />
          </Fragment>
        ))}
      </div>
    </details>
  )
}

function ProgressBar({ current, total }: { readonly current: number; readonly total: number }) {
  const ratio = total === 0 ? 0 : Math.min(current / total, 1)
  return (
    <div className="progress" role="progressbar" aria-valuenow={current} aria-valuemax={total}>
      <div className="progress-fill" style={{ inlineSize: `${String(ratio * 100)}%` }} />
      <span className="progress-label">
        {current} / {total}
      </span>
    </div>
  )
}

function CompletedBlock({ block }: { readonly block: Block }) {
  return (
    <div className="said-row">
      <Speaker who="assistant" />
      {block.kind === 'text' ? (
        <p className="said">{block.body}</p>
      ) : (
        <pre className="said is-code">
          <code>{block.body}</code>
        </pre>
      )}
    </div>
  )
}

const RANK_WORDS: Readonly<Record<Rank, string>> = {
  S: 'Nothing to correct',
  A: 'Ship it',
  B: 'Works on my machine',
  C: 'Needs another pass',
  D: 'Rolled back',
}

function Result({
  title,
  codeLanguage,
  difficulty,
  tally,
  bestCombo,
  onRestart,
}: {
  readonly title: string
  readonly codeLanguage: string
  readonly difficulty: string
  readonly tally: Tally
  readonly bestCombo: number
  readonly onRestart: () => void
}) {
  const grade = rank(tally)
  const card: ShareCard = {
    title,
    codeLanguage,
    difficulty,
    rank: grade,
    keysPerMinute: keysPerMinute(tally),
    accuracy: accuracy(tally),
    bestCombo,
  }

  return (
    <div className="result">
      <div className="result-rank" data-rank={grade}>
        <span className="result-grade">{grade}</span>
        <span className="result-word">{RANK_WORDS[grade]}</span>
      </div>
      <dl>
        <div>
          <dt>Time</dt>
          <dd>{formatDuration(tally.elapsedMs)}</dd>
        </div>
        <div>
          <dt>Keys per minute</dt>
          <dd>{keysPerMinute(tally)}</dd>
        </div>
        <div>
          <dt>Accuracy</dt>
          <dd>{accuracy(tally)}%</dd>
        </div>
        <div>
          <dt>Best combo</dt>
          <dd>×{bestCombo}</dd>
        </div>
        <div>
          <dt>Mistakes</dt>
          <dd>{tally.mistakes}</dd>
        </div>
      </dl>
      <div className="result-actions">
        <button type="button" className="result-again" onClick={onRestart}>
          Type it again
        </button>
        <ShareRow card={card} />
      </div>
    </div>
  )
}
