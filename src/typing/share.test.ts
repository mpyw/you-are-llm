import { describe, expect, it } from 'vitest'
import { clipboardText, shareTargets, shareText } from './share'

const CARD = {
  title: '%w を付け忘れて errors.Is が効かない',
  codeLanguage: 'Go',
  difficulty: 'Easy',
  rank: 'S',
  keysPerMinute: 412,
  accuracy: 100,
  bestCombo: 387,
} as const

const LINK = 'https://mpyw.me/you-are-llm/sessions/errwrap-go-easy-ja'

describe('shareText', () => {
  it('leads with the rank and carries the numbers', () => {
    expect(shareText(CARD)).toBe(
      'S rank on "%w を付け忘れて errors.Is が効かない" (Go, Easy) — 412 keys/min, 100% accuracy, ×387 best combo. #YouAreLLM',
    )
  })
})

describe('clipboardText', () => {
  it('puts the link on its own line', () => {
    expect(clipboardText(CARD, LINK)).toBe(`${shareText(CARD)}\n${LINK}`)
  })
})

describe('shareTargets', () => {
  const targets = shareTargets(CARD, LINK)

  it('offers the three services', () => {
    expect(targets.map((target) => target.name)).toEqual(['X', 'Bluesky', 'Facebook'])
  })

  it('splits text from link for X', () => {
    const x = new URL(targets[0]?.href ?? '')
    expect(x.origin + x.pathname).toBe('https://x.com/intent/post')
    expect(x.searchParams.get('text')).toBe(shareText(CARD))
    expect(x.searchParams.get('url')).toBe(LINK)
  })

  it('folds the link into the text for Bluesky', () => {
    const sky = new URL(targets[1]?.href ?? '')
    expect(sky.origin + sky.pathname).toBe('https://bsky.app/intent/compose')
    expect(sky.searchParams.get('text')).toBe(clipboardText(CARD, LINK))
  })

  it('sends only the link to Facebook', () => {
    const fb = new URL(targets[2]?.href ?? '')
    expect(fb.origin + fb.pathname).toBe('https://www.facebook.com/sharer/sharer.php')
    expect(fb.searchParams.get('u')).toBe(LINK)
    expect(fb.searchParams.get('text')).toBeNull()
  })
})
