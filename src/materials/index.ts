import { parseSession } from './parse'
import type { Session } from './types'

/**
 * Material ships as static JSON so it can later be generated from transcripts.
 * Files are picked up by pattern, so adding a session means adding a file.
 */
const modules = import.meta.glob<unknown>('./sessions/*.json', {
  eager: true,
  import: 'default',
})

const ORDER: readonly string[] = ['easy', 'normal', 'hard', 'expert', 'expertplus']

export const sessions: readonly Session[] = Object.keys(modules)
  .sort()
  .map((path) => parseSession(modules[path]))
  .sort(
    (left, right) =>
      left.codeLanguage.localeCompare(right.codeLanguage) ||
      ORDER.indexOf(left.difficulty) - ORDER.indexOf(right.difficulty) ||
      left.language.localeCompare(right.language),
  )

export function findSession(id: string): Session | undefined {
  return sessions.find((session) => session.id === id)
}

export { ANY, filtersFrom, matches } from './filters'
export type { Filters } from './filters'
export {
  MaterialError,
  isCodeLanguage,
  isDifficulty,
  isLanguage,
  parseSession,
} from './parse'
export { CODE_LANGUAGE_LABELS, DIFFICULTY_LABELS } from './types'
export type {
  Block,
  BlockKind,
  CodeLanguage,
  Difficulty,
  Language,
  Session,
  SourceFile,
  Turn,
} from './types'
