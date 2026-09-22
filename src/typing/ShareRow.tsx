import { useCallback, useEffect, useState } from 'react'
import type { ShareCard } from './share'
import { clipboardText, shareTargets } from './share'

type CopyState = 'idle' | 'copied' | 'failed'

const COPY_LABEL: Readonly<Record<CopyState, string>> = {
  idle: 'Copy',
  copied: 'Copied',
  failed: 'Copy failed',
}

/** Three marks for the three states, so the button says what happened. */
const COPY_PATHS: Readonly<Record<CopyState, string>> = {
  idle: 'M6 3h5a1 1 0 0 1 1 1v1M5 5h6a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z',
  copied: 'M3.5 8.5l3 3 6-6.5',
  failed: 'M8 3.5v5.5M8 12.2v.3',
}

function CopyMark({ state }: { readonly state: CopyState }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      <path
        d={COPY_PATHS[state]}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

const RESET_MS = 2000

export function ShareRow({ card }: { readonly card: ShareCard }) {
  const [copy, setCopy] = useState<CopyState>('idle')

  useEffect(() => {
    if (copy === 'idle') return undefined
    const timer = window.setTimeout(() => {
      setCopy('idle')
    }, RESET_MS)
    return () => {
      window.clearTimeout(timer)
    }
  }, [copy])

  const onCopy = useCallback(() => {
    const text = clipboardText(card, window.location.href)
    try {
      void navigator.clipboard.writeText(text).then(
        () => {
          setCopy('copied')
        },
        () => {
          setCopy('failed')
        },
      )
    } catch {
      // No clipboard outside a secure context, and nothing to be done about it.
      setCopy('failed')
    }
  }, [card])

  return (
    <div className="share">
      <span className="share-label">Share</span>
      {shareTargets(card, window.location.href).map((target) => (
        <a
          key={target.name}
          className="chip"
          href={target.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {target.name}
        </a>
      ))}
      <button
        type="button"
        className="chip is-icon"
        onClick={onCopy}
        data-state={copy}
        aria-label={COPY_LABEL[copy]}
        title={COPY_LABEL[copy]}
      >
        <CopyMark state={copy} />
      </button>
    </div>
  )
}
