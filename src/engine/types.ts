/** One romaji spelling of a chunk of kana. */
export interface Spelling {
  readonly text: string
  /**
   * True only for the bare `n` spelling of `ん`. An IME commits it as `ん`
   * just when the next chunk starts with a consonant other than `n` or `y`;
   * otherwise the typist has to write `nn`.
   */
  readonly requiresConsonantNext: boolean
}

/** One or more kana that can be typed as a single unit, with every spelling of it. */
export interface Chunk {
  readonly kana: string
  readonly spellings: readonly Spelling[]
}

/**
 * A keyboard layout: how kana map to key sequences.
 *
 * Swapping this is how alternative input methods (AZIK and friends) plug in.
 * The engine itself knows nothing about any particular table.
 */
export interface Layout {
  readonly name: string
  /** Kana (one or two characters) to every spelling that produces it. */
  readonly table: ReadonlyMap<string, readonly Spelling[]>
  /** Characters that are not kana but are still typed as something else, such as `、` to `,`. */
  readonly punctuation: ReadonlyMap<string, readonly string[]>
}
