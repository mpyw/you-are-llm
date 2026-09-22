import { isCodeLanguage, isDifficulty, isLanguage } from './parse'
import type { CodeLanguage, Difficulty, Language, Session } from './types'

/** What the list shows when a filter is off. Language says it out loud. */
export const ANY = 'all'

export interface Filters {
  // Optional on purpose: every link to the list may leave the search empty.
  readonly lang?: Language | typeof ANY | undefined
  readonly difficulty?: Difficulty | undefined
  readonly code?: CodeLanguage | undefined
}

function pick<T extends string>(
  value: unknown,
  guard: (candidate: string) => candidate is T,
): T | undefined {
  return typeof value === 'string' && guard(value) ? value : undefined
}

/**
 * The list opens on Japanese, because that is what most of it is for. Showing
 * both is a choice the reader makes, so it is spelled out in the address rather
 * than being what an empty one happens to mean.
 */
export function filtersFrom(search: Record<string, unknown>): Filters {
  const lang = search.lang
  return {
    lang: lang === ANY ? ANY : (pick(lang, isLanguage) ?? 'ja'),
    difficulty: pick(search.difficulty, isDifficulty),
    code: pick(search.code, isCodeLanguage),
  }
}

export function matches(session: Session, filters: Filters): boolean {
  if (filters.lang !== ANY && filters.lang !== undefined && session.language !== filters.lang) {
    return false
  }
  if (filters.difficulty !== undefined && session.difficulty !== filters.difficulty) return false
  if (filters.code !== undefined && session.codeLanguage !== filters.code) return false
  return true
}
