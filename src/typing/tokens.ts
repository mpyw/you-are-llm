/**
 * One run of the target as the typing area draws it. Spaces and newlines get a
 * token each, because those are the characters that need a mark: a newline has
 * no glyph of its own, and a space at the end of a line has nothing after it to
 * show that it is there.
 */
export interface Token {
  /** Index into the whole target, which is also the React key. */
  readonly start: number
  readonly kind: 'text' | 'space' | 'newline'
  readonly text: string
}

/** Splits `text`, which starts at `offset` in the target, into tokens. */
export function tokenize(text: string, offset = 0): readonly Token[] {
  const tokens: Token[] = []
  let run = ''
  let runStart = offset
  const flush = () => {
    if (run.length > 0) tokens.push({ start: runStart, kind: 'text', text: run })
    run = ''
  }
  let index = offset
  for (const char of text) {
    if (char === ' ' || char === '\n') {
      flush()
      tokens.push({ start: index, kind: char === ' ' ? 'space' : 'newline', text: char })
    } else {
      if (run.length === 0) runStart = index
      run += char
    }
    index += char.length
  }
  flush()
  return tokens
}

/**
 * A space that ends a line whatever the width: the one before a newline, and
 * the one at the very end. A space that ends a line only because the text
 * wrapped there is found by measuring, since that depends on the width.
 */
export function endsLineAlways(target: string, start: number): boolean {
  const next = start + 1
  return next >= target.length || target[next] === '\n'
}
