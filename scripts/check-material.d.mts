/** Punctuation a Japanese `reading` may contain on top of kana and ASCII. */
export declare const ALLOWED_PUNCTUATION: string

/** Turns of phrase that give an LLM away in Japanese. */
export declare const AI_TELLS: readonly string[]

/** The "actually, I was wrong" phrases an LLM reaches for. */
export declare const SELF_CORRECTIONS: readonly string[]

/** Mechanical problems with one session object, empty when it is sound. */
export declare function validate(session: unknown): string[]
