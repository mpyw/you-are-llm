import { canDoubleForSokuon } from './kana'
import type { Chunk, Layout, Spelling } from './types'

const SOKUON = 'っ'

/**
 * Splits one target string into the chunks that can be typed at each position.
 *
 * A position usually offers several chunks at once: `きゃ` can be one chunk
 * (`kya`) or two (`ki` then `xya`), and the typist picks by what they press.
 * Results are cached per position because the target never changes.
 */
export class Segmenter {
  private readonly cache: (readonly Chunk[] | undefined)[]

  constructor(
    private readonly layout: Layout,
    private readonly kana: string,
  ) {
    this.cache = new Array<readonly Chunk[] | undefined>(kana.length)
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
