import { describe, expect, it } from 'vitest'
import { validate } from '../../scripts/check-material.mjs'

/** Only what the checker says about the reading, not the rest of the session rules. */
function readingComplaints(body: string, reading: string): string[] {
  const session = {
    id: 'x-go-ja',
    title: 't',
    language: 'ja',
    difficulty: 'easy',
    codeLanguage: 'go',
    summary: 's',
    files: [],
    turns: [{ user: 'u', assistant: [{ kind: 'text', body, reading }] }],
  }
  return validate(session).filter((problem) => problem.includes('disagrees with the body'))
}

// Every failing case below is one that shipped and was found by reading it.
describe('a reading that has to follow its body', () => {
  it('passes when every kana, letter and mark is where the body has it', () => {
    expect(readingComplaints('一括で効きます。', 'いっかつでききます。')).toEqual([])
  })

  it('lets katakana be typed as hiragana', () => {
    expect(readingComplaints('スレッドを止めます。', 'すれっどをとめます。')).toEqual([])
  })

  it('catches a dropped kana', () => {
    expect(readingComplaints('一括で効きます。', 'いっかつできます。')).toHaveLength(1)
  })

  it('catches a swapped particle', () => {
    expect(readingComplaints('%s が配列の外まで読みます。', '%s はいれつのそとまでよみます。')).toHaveLength(1)
  })

  it('catches a comma the body does not have', () => {
    expect(readingComplaints('保証されないので解決しません。', 'ほしょうされないので、かいけつしません。')).toHaveLength(1)
  })

  it('catches a Latin word in the wrong case', () => {
    expect(readingComplaints('Commit 済みです。', 'commit ずみです。')).toHaveLength(1)
  })

  it('catches a space the body does not have', () => {
    expect(readingComplaints('Category は非 null です。', 'Category は ひ null です。')).toHaveLength(1)
  })
})
