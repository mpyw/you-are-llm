/** How one block of an assistant turn is presented. */
export type BlockKind = 'text' | 'code' | 'command'

export interface Block {
  readonly kind: BlockKind
  /** What the reader sees. Japanese prose keeps its kanji here. */
  readonly body: string
  /**
   * What the typist actually types. Null means `body` is typed as it stands,
   * which is what code and shell commands need. Japanese prose puts its kana
   * reading here, because an IME turns kana into kanji, not the other way round.
   */
  readonly reading: string | null
  /** Language tag for `code` blocks, null otherwise. */
  readonly lang: string | null
}

export interface Turn {
  /** Shown as the prompt. Never typed. */
  readonly user: string
  readonly assistant: readonly Block[]
}

export interface SourceFile {
  readonly path: string
  readonly content: string
}

export type Language = 'ja' | 'en'

export interface Session {
  readonly id: string
  readonly title: string
  readonly language: Language
  readonly summary: string
  readonly files: readonly SourceFile[]
  readonly turns: readonly Turn[]
}
