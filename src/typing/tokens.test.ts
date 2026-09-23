import { describe, expect, it } from 'vitest'
import { endsLineAlways, tokenize } from './tokens'

describe('tokenize', () => {
  it('gives every space and newline a token of its own', () => {
    expect(tokenize('a b\nc').map((token) => [token.kind, token.text])).toEqual([
      ['text', 'a'],
      ['space', ' '],
      ['text', 'b'],
      ['newline', '\n'],
      ['text', 'c'],
    ])
  })

  it('keeps a word in one token', () => {
    expect(tokenize('transaction')).toEqual([{ start: 0, kind: 'text', text: 'transaction' }])
  })

  it('counts positions from where the text starts in the target', () => {
    // The part after the caret is tokenized on its own, so its keys must still
    // be positions in the whole target.
    expect(tokenize('b c', 5).map((token) => token.start)).toEqual([5, 6, 7])
  })

  it('makes two runs of each space, not one', () => {
    expect(tokenize('a  b').filter((token) => token.kind === 'space')).toHaveLength(2)
  })
})

describe('endsLineAlways', () => {
  it('holds for a space before a newline and a space at the end', () => {
    const target = 'a \nb '
    expect(endsLineAlways(target, 1)).toBe(true)
    expect(endsLineAlways(target, 4)).toBe(true)
  })

  it('does not hold for a space between two words', () => {
    expect(endsLineAlways('a b', 1)).toBe(false)
  })
})
