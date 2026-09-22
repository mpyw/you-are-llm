/** Punctuation a Japanese `reading` may contain on top of kana and ASCII. */
export declare const ALLOWED_PUNCTUATION: string

/** Mechanical problems with one session object, empty when it is sound. */
export declare function validate(session: unknown): string[]
