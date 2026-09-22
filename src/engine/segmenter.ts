import { canDoubleForSokuon } from './kana'
import type { Chunk, Layout, Spelling } from './types'

const SOKUON = 'っ'
const TAB = '\t'

/**
 * How wide one indent step is in this target, taken as the smallest indent any
 * line uses. Two space code gives two, four space code gives four, and a target
 * with no indented line gives nothing to press Tab for.
 */
function indentWidth(text: string): number {
  let width = 0
  for (const line of text.split('\n')) {
    const spaces = line.length - line.trimStart().length
    if (spaces > 0 && (width === 0 || spaces < width)) width = spaces
  }
  return width
}

/**
 * Splits one target string into the chunks that can be typed at each position.
 *
 * A position usually offers several chunks at once: `きゃ` can be one chunk
 * (`kya`) or two (`ki` then `xya`), and the typist picks by what they press.
 * Results are cached per position because the target never changes.
 */
export class Segmenter {
  private readonly cache: (readonly Chunk[] | undefined)[]

  private readonly indent: number

  constructor(
    private readonly layout: Layout,
    private readonly kana: string,
  ) {
    this.cache = new Array<readonly Chunk[] | undefined>(kana.length)
    this.indent = indentWidth(kana)
  }

  candidatesAt(pos: number): readonly Chunk[] {
    if (pos >= this.kana.length) return []
    const cached = this.cache[pos]
    if (cached !== undefined) return cached
    const chunks = this.build(pos)
    this.cache[pos] = chunks
    return chunks
  }

  private build(pos: number): readonly Chunk[] {
    const chunks: Chunk[] = []

    const step = this.indentStepAt(pos)
    if (step !== null) chunks.push(step)

    const digraph = this.kana.slice(pos, pos + 2)
    if (digraph.length === 2) {
      const spellings = this.layout.table.get(digraph)
      if (spellings !== undefined) chunks.push({ kana: digraph, spellings })
    }

    const head = this.kana.slice(pos, pos + 1)
    if (head === SOKUON) chunks.push(...this.doubledConsonantChunks(pos))

    const spellings = this.layout.table.get(head)
    if (spellings !== undefined) {
      chunks.push({ kana: head, spellings })
    } else if (head.length === 1) {
      chunks.push({ kana: head, spellings: this.passthrough(head) })
    }

    return chunks
  }

  /**
   * One step of indentation, which Tab types as readily as the spaces do.
   * Only offered inside the run of spaces that opens a line, so a Tab pressed
   * anywhere else is left alone to move focus.
   */
  private indentStepAt(pos: number): Chunk | null {
    if (this.indent === 0) return null
    const spaces = this.kana.slice(pos, pos + this.indent)
    if (spaces.length < this.indent || !/^ +$/u.test(spaces)) return null

    let before = pos - 1
    while (before >= 0 && this.kana[before] === ' ') before -= 1
    if (before >= 0 && this.kana[before] !== '\n') return null

    return {
      kana: spaces,
      spellings: [
        { text: spaces, requiresConsonantNext: false },
        { text: TAB, requiresConsonantNext: false },
      ],
    }
  }

  /** `っか` typed as `kka`: the sokuon borrows the next chunk's first key. */
  private doubledConsonantChunks(pos: number): Chunk[] {
    const chunks: Chunk[] = []
    for (const next of this.candidatesAt(pos + 1)) {
      const spellings = next.spellings.flatMap((spelling) => {
        const head = spelling.text[0]
        if (head === undefined || !canDoubleForSokuon(spelling.text)) return []
        return [{ ...spelling, text: head + spelling.text }]
      })
      if (spellings.length > 0) chunks.push({ kana: SOKUON + next.kana, spellings })
    }
    return chunks
  }

  /** Anything the layout does not know about is typed as itself, which is what source code needs. */
  private passthrough(char: string): readonly Spelling[] {
    const mapped = this.layout.punctuation.get(char) ?? [char]
    return mapped.map((text) => ({ text, requiresConsonantNext: false }))
  }
}
