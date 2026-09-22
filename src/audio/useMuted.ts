import { useCallback, useEffect, useState } from 'react'
import type { SoundBoard } from './SoundBoard'

const STORAGE_KEY = 'you-are-llm:muted'

/**
 * Browser storage is a per viewer convenience here, nothing more. A private
 * window or blocked site data just means the trainer starts unmuted.
 */
function readMuted(): boolean {
  try {
    return globalThis.localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    // Storage can be missing or refused. Sound stays on.
    return false
  }
}

export function useMuted(board: SoundBoard): readonly [boolean, () => void] {
  const [muted, setMuted] = useState(readMuted)

  useEffect(() => {
    board.mute(muted)
    try {
      globalThis.localStorage.setItem(STORAGE_KEY, String(muted))
    } catch {
      // Not being able to remember the choice is not worth failing over.
    }
  }, [board, muted])

  const toggle = useCallback(() => {
    setMuted((on) => !on)
  }, [])

  return [muted, toggle]
}
