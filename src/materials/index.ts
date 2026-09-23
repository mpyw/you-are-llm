import summaries from 'virtual:session-index'
import { parseSession, parseSummary } from './parse'
import type { Session, SessionSummary } from './types'

/**
 * Material ships as static JSON so it can later be generated from transcripts.
 * Files are picked up by pattern, so adding a session means adding a file.
 *
 * The list only needs `sessionIndex`, which the build writes from those files.
 * A body is fetched when its session is opened, so each one is its own chunk.
 */
const bodies = import.meta.glob<unknown>('./sessions/*.json', { import: 'default' })

const ORDER: readonly string[] = ['easy', 'normal', 'hard', 'expert', 'expertplus']

export const sessionIndex: readonly SessionSummary[] = summaries
  .map(parseSummary)
  .sort(
    (left, right) =>
      left.codeLanguage.localeCompare(right.codeLanguage) ||
      ORDER.indexOf(left.difficulty) - ORDER.indexOf(right.difficulty) ||
      left.language.localeCompare(right.language) ||
      left.id.localeCompare(right.id),
  )

export async function loadSession(id: string): Promise<Session | undefined> {
  const load = bodies[`./sessions/${id}.json`]
  return load === undefined ? undefined : parseSession(await load())
}

export { ANY, filtersFrom, matches } from './filters'
export type { Filters } from './filters'
export {
  MaterialError,
  isCodeLanguage,
  isDifficulty,
  isLanguage,
  parseSession,
  parseSummary,
} from './parse'
export { CODE_LANGUAGE_LABELS, DIFFICULTY_LABELS } from './types'
export type {
  Block,
  BlockKind,
  CodeLanguage,
  Difficulty,
  Language,
  Session,
  SessionSummary,
  SourceFile,
  Turn,
} from './types'
