import { useCallback, useEffect, useState } from 'react'
import type { ShareCard } from './share'
import { clipboardText, shareTargets } from './share'

type CopyState = 'idle' | 'copied' | 'failed'

const COPY_LABEL: Readonly<Record<CopyState, string>> = {
  idle: 'Copy',
  copied: 'Copied',
  failed: 'Copy failed',
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
      <button type="button" className="chip" onClick={onCopy} data-state={copy}>
        {COPY_LABEL[copy]}
      </button>
    </div>
  )
}
