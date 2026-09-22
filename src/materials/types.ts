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
  /** Highlight tag for `code` blocks, null otherwise. */
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

/** The language the session is written in. */
export type Language = 'ja' | 'en'

/**
 * How hard the session is to type, measured across every language rather than
 * within one. Rust reaches for `&`, `<>` and `::` in its gentlest session, so
 * an easy Rust session does not exist. `scripts/typing-load.mjs` does the sums.
 */
export type Difficulty = 'easy' | 'normal' | 'hard' | 'expert' | 'expertplus'

/** The language of the code under discussion. */
export type CodeLanguage =
  | 'c'
  | 'cpp'
  | 'csharp'
  | 'go'
  | 'java'
  | 'php'
  | 'rust'
  | 'typescript'

export const CODE_LANGUAGE_LABELS: Readonly<Record<CodeLanguage, string>> = {
  c: 'C',
  cpp: 'C++',
  csharp: 'C#',
  go: 'Go',
  java: 'Java',
  php: 'PHP',
  rust: 'Rust',
  typescript: 'TypeScript',
}

export const DIFFICULTY_LABELS: Readonly<Record<Difficulty, string>> = {
  easy: 'Easy',
  normal: 'Normal',
  hard: 'Hard',
  expert: 'Expert',
  expertplus: 'Expert+',
}

export interface Session {
  readonly id: string
  readonly title: string
  readonly language: Language
  readonly difficulty: Difficulty
  readonly codeLanguage: CodeLanguage
  readonly summary: string
  readonly files: readonly SourceFile[]
  readonly turns: readonly Turn[]
}
