import { startsWithHardConsonant, toHiragana } from './kana'
import { standardLayout } from './layouts/standard'
import { Segmenter } from './segmenter'
import type { Layout, Spelling } from './types'

/** One live guess at what the typist is in the middle of writing. */
interface Cursor {
  /** Index into the target where this chunk starts. */
  readonly pos: number
  /** Kana this chunk covers. */
  readonly kana: string
  readonly spelling: Spelling
  /** How many characters of `spelling.text` have been accepted. */
  readonly index: number
}

export interface SessionState {
  /** Characters of the target that are fully typed and can no longer change. */
  readonly committed: number
  /** Keys accepted so far, in order. */
  readonly typed: string
  /** Shortest key sequence that still finishes the target. */
  readonly remaining: string
  /** Every key that would be accepted right now. */
  readonly nextKeys: readonly string[]
  readonly done: boolean
  readonly accepted: number
  readonly mistakes: number
}

/**
 * Tracks one typing run over one target string.
 *
 * The engine keeps every spelling alive at once rather than committing to a
 * reading up front, so `し` accepts `si`, `shi` or `ci` and `きゃ` accepts
 * `kya`, `kixya` or `kilya` without the typist declaring which they meant.
 */
export class TypingSession {
  private readonly kana: string
  private readonly segmenter: Segmenter
  private readonly shortestCache = new Map<number, string | null>()

  private cursors: readonly Cursor[] = []
  private keys: string[] = []
  private finished = false
  private mistakeCount = 0

  constructor(
    readonly target: string,
    private readonly layout: Layout = standardLayout,
  ) {
    this.kana = toHiragana(target)
    this.segmenter = new Segmenter(layout, this.kana)
    this.reset()
  }

  reset(): void {
    this.cursors = this.expand(0, false)
    this.keys = []
    this.finished = this.kana.length === 0
    this.mistakeCount = 0
  }

  /** Feed one key. Returns whether it was accepted; a rejected key counts as a mistake. */
  press(key: string): boolean {
    if (this.finished) return false

    const next: Cursor[] = []
    let reachedEnd = false

    for (const cursor of this.cursors) {
      if (cursor.spelling.text[cursor.index] !== key) continue
      const index = cursor.index + 1
      if (index < cursor.spelling.text.length) {
        next.push({ ...cursor, index })
        continue
      }
      const pos = cursor.pos + cursor.kana.length
      if (pos >= this.kana.length) {
        if (!cursor.spelling.requiresConsonantNext) reachedEnd = true
        continue
      }
      next.push(...this.expand(pos, cursor.spelling.requiresConsonantNext))
    }

    if (!reachedEnd && next.length === 0) {
      this.mistakeCount += 1
      return false
    }

    this.keys.push(key)
    if (reachedEnd) {
      this.finished = true
      this.cursors = []
    } else {
      this.cursors = next
    }
    return true
  }

  get state(): SessionState {
    return {
      committed: this.committed,
      typed: this.keys.join(''),
      remaining: this.remaining,
      nextKeys: this.nextKeys,
      done: this.finished,
      accepted: this.keys.length,
      mistakes: this.mistakeCount,
    }
  }

  /**
   * How much of the target is settled. While a chunk is half typed its own
   * kana stay uncommitted, because `ki` could still turn into `きゃ`.
   */
  private get committed(): number {
    if (this.finished) return this.target.length
    let min = this.kana.length
    for (const cursor of this.cursors) min = Math.min(min, cursor.pos)
    return min
  }

  private get nextKeys(): readonly string[] {
    const keys = new Set<string>()
    for (const cursor of this.cursors) {
      const key = cursor.spelling.text[cursor.index]
      if (key !== undefined) keys.add(key)
    }
    return [...keys]
  }

  private get remaining(): string {
    if (this.finished) return ''
    let best: string | null = null
    for (const cursor of this.cursors) {
      const tail = this.shortestFrom(
        cursor.pos + cursor.kana.length,
        cursor.spelling.requiresConsonantNext,
      )
      if (tail === null) continue
      const candidate = cursor.spelling.text.slice(cursor.index) + tail
      if (best === null || candidate.length < best.length) best = candidate
    }
    return best ?? ''
  }

  private expand(pos: number, afterBareN: boolean): Cursor[] {
    const cursors: Cursor[] = []
    for (const chunk of this.segmenter.candidatesAt(pos)) {
      for (const spelling of chunk.spellings) {
        if (afterBareN && !startsWithHardConsonant(spelling.text)) continue
        cursors.push({ pos, kana: chunk.kana, spelling, index: 0 })
      }
    }
    return cursors
  }

  /** Shortest way to finish from `pos`, or null when this branch is a dead end. */
  private shortestFrom(pos: number, afterBareN: boolean): string | null {
    if (pos >= this.kana.length) return afterBareN ? null : ''
    const key = pos * 2 + (afterBareN ? 1 : 0)
    const cached = this.shortestCache.get(key)
    if (cached !== undefined) return cached

    let best: string | null = null
    for (const chunk of this.segmenter.candidatesAt(pos)) {
      for (const spelling of chunk.spellings) {
        if (afterBareN && !startsWithHardConsonant(spelling.text)) continue
        const tail = this.shortestFrom(pos + chunk.kana.length, spelling.requiresConsonantNext)
        if (tail === null) continue
        const candidate = spelling.text + tail
        if (best === null || candidate.length < best.length) best = candidate
      }
    }
    this.shortestCache.set(key, best)
    return best
  }

  /** The layout this session was built with, so a UI can label the input mode. */
  get layoutName(): string {
    return this.layout.name
  }
}
