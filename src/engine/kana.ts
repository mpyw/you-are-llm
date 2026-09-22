const KATAKANA_START = 0x30a1 // ァ
const KATAKANA_END = 0x30f6 // ヶ
const KANA_OFFSET = 0x60

/**
 * Fold katakana onto hiragana so the table only needs hiragana entries.
 * The mapping is per character, so indices into the result still line up with
 * the original text.
 */
export function toHiragana(text: string): string {
  let out = ''
  for (const char of text) {
    const code = char.codePointAt(0)
    out +=
      code !== undefined && code >= KATAKANA_START && code <= KATAKANA_END
        ? String.fromCodePoint(code - KANA_OFFSET)
        : char
  }
  return out
}

const VOWEL_KEYS = new Set(['a', 'i', 'u', 'e', 'o'])

function isLowerLatin(char: string | undefined): char is string {
  return char !== undefined && char >= 'a' && char <= 'z'
}

/**
 * Whether `っ` can be typed by doubling the first key of `text`.
 * Every consonant works except `n`, which an IME reads as `ん` instead.
 */
export function canDoubleForSokuon(text: string): boolean {
  const head = text[0]
  return isLowerLatin(head) && !VOWEL_KEYS.has(head) && head !== 'n'
}

/**
 * Whether `text` may follow a bare `n`. Vowels would merge into `な` row,
 * and `n` or `y` would be read as `nn` or `にゃ`, so all of those are out.
 */
export function startsWithHardConsonant(text: string): boolean {
  const head = text[0]
  return isLowerLatin(head) && !VOWEL_KEYS.has(head) && head !== 'n' && head !== 'y'
}
