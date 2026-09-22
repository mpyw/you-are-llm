import type { Rank } from './stats'

export interface ShareCard {
  readonly title: string
  readonly rank: Rank
  readonly keysPerMinute: number
  readonly accuracy: number
  readonly bestCombo: number
}

const HASHTAG = '#YouAreLLM'

/** The boast itself, without the link. */
export function shareText(card: ShareCard): string {
  const score = [
    `${String(card.keysPerMinute)} keys/min`,
    `${String(card.accuracy)}% accuracy`,
    `×${String(card.bestCombo)} best combo`,
  ].join(', ')
  return `${card.rank} rank on "${card.title}" — ${score}. ${HASHTAG}`
}

/** What lands on the clipboard, which is the boast and the link together. */
export function clipboardText(card: ShareCard, url: string): string {
  return `${shareText(card)}\n${url}`
}

export interface ShareTarget {
  readonly name: string
  readonly href: string
}

/**
 * Each service takes the share differently. X splits the text from the link,
 * Bluesky wants one field, and Facebook accepts a link and nothing else.
 */
export function shareTargets(card: ShareCard, url: string): readonly ShareTarget[] {
  const text = shareText(card)
  return [
    {
      name: 'X',
      href: `https://x.com/intent/post?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
    },
    {
      name: 'Bluesky',
      href: `https://bsky.app/intent/compose?text=${encodeURIComponent(`${text}\n${url}`)}`,
    },
    {
      name: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
  ]
}
