import { toHiragana } from './kana'
import { standardLayout } from './layouts/standard'
import type { Layout } from './types'

const ASCII_MAX = 0x7f

/**
 * Characters of `target` that the layout does not cover and that are not ASCII.
 *
 * Anything reported here falls through to plain passthrough, which asks the
 * typist to produce that character directly. No keyboard does that for kanji or
 * for full width punctuation, so material has to be free of them.
 */
export function untypeableCharacters(
  target: string,
  layout: Layout = standardLayout,
): readonly string[] {
  const offenders = new Set<string>()
  for (const char of toHiragana(target)) {
    const code = char.codePointAt(0)
    if (code !== undefined && code <= ASCII_MAX) continue
    if (layout.table.has(char) || layout.punctuation.has(char)) continue
    offenders.add(char)
  }
  return [...offenders]
}
