import en from './fetch-user-retry-en.json'
import ja from './fetch-user-retry-ja.json'
import { parseSession } from './parse'
import type { Session } from './types'

/** Material ships as static JSON so it can later be generated from real transcripts. */
export const sessions: readonly Session[] = [ja, en].map(parseSession)

export function findSession(id: string): Session | undefined {
  return sessions.find((session) => session.id === id)
}

export { MaterialError, parseSession } from './parse'
export type { Block, BlockKind, Language, Session, SourceFile, Turn } from './types'
