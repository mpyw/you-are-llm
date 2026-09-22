import { Fragment, useCallback, useMemo, useState } from 'react'
import type { SessionState } from '../engine'
import type { Block, Session } from '../materials'
import { CODE_LANGUAGE_LABELS, DIFFICULTY_LABELS } from '../materials'
import { TypingArea } from './TypingArea'
import { accuracy, formatDuration, keysPerMinute } from './stats'
import { toSteps } from './steps'

interface Progress {
  readonly index: number
  readonly accepted: number
  readonly mistakes: number
  readonly startedAt: number | null
  readonly finishedAt: number | null
}

const START: Progress = { index: 0, accepted: 0, mistakes: 0, startedAt: null, finishedAt: null }

export function SessionPlayer({ session }: { readonly session: Session }) {
  const steps = useMemo(() => toSteps(session), [session])
  const [progress, setProgress] = useState<Progress>(START)

  const handleChange = useCallback(
    (state: SessionState) => {
      // Read the clock outside the updater so the updater stays pure.
      const now = Date.now()
      setProgress((current) => {
        const startedAt = current.startedAt ?? now
        if (!state.done) return { ...current, startedAt }
        const index = current.index + 1
        return {
          index,
          accepted: current.accepted + state.accepted,
          mistakes: current.mistakes + state.mistakes,
          startedAt,
          finishedAt: index >= steps.length ? now : null,
        }
      })
    },
    [steps.length],
  )

  const restart = useCallback(() => {
    setProgress(START)
  }, [])

  const done = progress.index >= steps.length

  return (
    <article className="player">
      <header className="player-head">
        <h1>{session.title}</h1>
        <p className="tags">
          <span className="badge">{CODE_LANGUAGE_LABELS[session.codeLanguage]}</span>
          <span className={`badge is-${session.difficulty}`}>
            {DIFFICULTY_LABELS[session.difficulty]}
          </span>
          <span className="badge">{session.language}</span>
        </p>
        <p className="summary">{session.summary}</p>
        <ProgressBar current={progress.index} total={steps.length} />
      </header>

      <div className="player-body">
        <aside className="context">
          {session.files.map((file) => (
            <section key={file.path}>
              <h2>{file.path}</h2>
              <pre>{file.content}</pre>
            </section>
          ))}
        </aside>

        <section className="transcript">
          {steps.map((step, index) =>
            index > progress.index ? null : (
              <Fragment key={`${String(step.turnIndex)}:${String(step.blockIndex)}`}>
                {step.prompt === null ? null : <p className="prompt">{step.prompt}</p>}
                {index < progress.index ? (
                  <CompletedBlock block={step.block} />
                ) : (
                  <TypingArea key={index} step={step} onChange={handleChange} />
                )}
              </Fragment>
            ),
          )}
          {done ? <Result progress={progress} onRestart={restart} /> : null}
        </section>
      </div>
    </article>
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
  if (block.kind === 'text') return <p className="said">{block.body}</p>
  return (
    <pre className="said is-code">
      <code>{block.body}</code>
    </pre>
  )
}

function Result({
  progress,
  onRestart,
}: {
  readonly progress: Progress
  readonly onRestart: () => void
}) {
  const elapsedMs =
    progress.startedAt === null || progress.finishedAt === null
      ? 0
      : progress.finishedAt - progress.startedAt
  const tally = { accepted: progress.accepted, mistakes: progress.mistakes, elapsedMs }

  return (
    <div className="result">
      <h2>Session complete</h2>
      <dl>
        <div>
          <dt>Time</dt>
          <dd>{formatDuration(elapsedMs)}</dd>
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
          <dt>Mistakes</dt>
          <dd>{progress.mistakes}</dd>
        </div>
      </dl>
      <button type="button" onClick={onRestart}>
        Type it again
      </button>
    </div>
  )
}
