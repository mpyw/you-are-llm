export interface Tally {
  readonly accepted: number
  readonly mistakes: number
  readonly elapsedMs: number
}

/** Keys per minute, counting only keys the engine accepted. */
export function keysPerMinute({ accepted, elapsedMs }: Tally): number {
  if (elapsedMs <= 0) return 0
  return Math.round(accepted / (elapsedMs / 60_000))
}

/** Share of key presses that landed, as a percentage. */
export function accuracy({ accepted, mistakes }: Tally): number {
  const total = accepted + mistakes
  if (total === 0) return 100
  return Math.round((accepted / total) * 100)
}

export function formatDuration(elapsedMs: number): string {
  const totalSeconds = Math.max(0, Math.round(elapsedMs / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes)}:${String(seconds).padStart(2, '0')}`
}

export type Rank = 'S' | 'A' | 'B' | 'C' | 'D'

/** Speed alone does not earn a rank. Both floors have to be cleared. */
const TIERS: readonly { readonly rank: Rank; readonly kpm: number; readonly accuracy: number }[] = [
  { rank: 'S', kpm: 360, accuracy: 98 },
  { rank: 'A', kpm: 260, accuracy: 95 },
  { rank: 'B', kpm: 180, accuracy: 90 },
  { rank: 'C', kpm: 100, accuracy: 80 },
]

export function rank(tally: Tally): Rank {
  const speed = keysPerMinute(tally)
  const hits = accuracy(tally)
  return TIERS.find((tier) => speed >= tier.kpm && hits >= tier.accuracy)?.rank ?? 'D'
}
