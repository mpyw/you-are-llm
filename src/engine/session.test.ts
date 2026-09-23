import { describe, expect, it } from 'vitest'
import { TypingSession } from './session'

function feed(target: string, keys: string) {
  const session = new TypingSession(target)
  let accepted = true
  for (const key of keys) accepted = session.press(key) && accepted
  return { session, accepted }
}

function completes(target: string, keys: string): boolean {
  const { session, accepted } = feed(target, keys)
  return accepted && session.state.done
}

describe('spelling alternatives', () => {
  it.each(['si', 'shi', 'ci'])('accepts %s for し', (keys) => {
    expect(completes('し', keys)).toBe(true)
  })

  it.each(['kya', 'kixya', 'kilya'])('accepts %s for きゃ', (keys) => {
    expect(completes('きゃ', keys)).toBe(true)
  })

  it.each(['zya', 'ja', 'jya', 'zixya'])('accepts %s for じゃ', (keys) => {
    expect(completes('じゃ', keys)).toBe(true)
  })

  it.each(['konnnitiha', 'konnnichiha', 'konnnitihha'])('accepts %s for こんにちは', (keys) => {
    expect(completes('こんにちは', keys)).toBe(keys !== 'konnnitihha')
  })
})

describe('ん', () => {
  it('needs nn at the end of the target', () => {
    const { session } = feed('にほん', 'nihon')
    expect(session.state.done).toBe(false)
    expect(session.press('n')).toBe(true)
    expect(session.state.done).toBe(true)
  })

  it('accepts a bare n before a consonant', () => {
    expect(completes('かんじ', 'kanzi')).toBe(true)
  })

  it('rejects a bare n before a vowel', () => {
    const { session } = feed('きんいろ', 'kin')
    expect(session.press('i')).toBe(false)
    expect(session.state.mistakes).toBe(1)
  })

  it('rejects a bare n before な row', () => {
    const { session } = feed('こんにちは', 'kon')
    expect(session.press('i')).toBe(false)
  })

  it('accepts xn and n apostrophe', () => {
    expect(completes('ほん', 'hoxn')).toBe(true)
    expect(completes('ほん', "hon'")).toBe(true)
  })
})

describe('っ', () => {
  it.each(['kitte', 'kixtute', 'kiltute'])('accepts %s for きって', (keys) => {
    expect(completes('きって', keys)).toBe(true)
  })

  it('only accepts the explicit spelling at the end of the target', () => {
    expect(completes('あっ', 'axtu')).toBe(true)
    expect(completes('あっ', 'at')).toBe(false)
  })

  it('does not double n', () => {
    expect(completes('あっな', 'anna')).toBe(false)
    expect(completes('あっな', 'axtuna')).toBe(true)
  })
})

describe('digraphs that would shadow a single kana', () => {
  it('does not let shi stand for しぃ', () => {
    const { session } = feed('しぃ', 'shi')
    expect(session.state.done).toBe(false)
    expect(completes('しぃ', 'syi')).toBe(true)
    expect(completes('しぃ', 'shixi')).toBe(true)
  })

  it('does not let fu stand for ふぅ', () => {
    expect(completes('ふぅ', 'fu')).toBe(false)
    expect(completes('ふぅ', 'fuxu')).toBe(true)
  })
})

describe('indentation', () => {
  const code = ['function f() {', '  if (x) {', '    return 1', '  }', '}'].join('\n')

  it('takes a tab for each step of indent', () => {
    const session = new TypingSession(code)
    for (const key of 'function f() {\n\tif (x) {\n\t\treturn 1') {
      expect(session.press(key), JSON.stringify(key)).toBe(true)
    }
    expect(session.state.committed).toBe(code.indexOf('return 1') + 'return 1'.length)
  })

  it('still takes the spaces themselves', () => {
    const session = new TypingSession(code)
    for (const key of 'function f() {\n  if (x) {') {
      expect(session.press(key), JSON.stringify(key)).toBe(true)
    }
    expect(session.state.committed).toBe(code.indexOf('if (x) {') + 'if (x) {'.length)
  })

  it('offers no tab where nothing is indented', () => {
    expect(new TypingSession('hello').state.nextKeys).toEqual(['h'])
  })

  it('does not multiply when a step is one space wide', () => {
    // A C++ access specifier indented by one space makes every leading space a
    // step. Each one is reachable as a step and as a plain space, and the
    // copies used to double per key until the heap ran out.
    const lines = [' public:', ...Array.from({ length: 40 }, () => '            x();')]
    expect(completes(lines.join('\n'), lines.join('\n'))).toBe(true)
  }, 2000)

  it('offers no tab part way along a line', () => {
    const session = new TypingSession(code)
    for (const key of 'function') session.press(key)
    expect(session.state.nextKeys).not.toContain('\t')
  })
})

describe('a japanese keyboard', () => {
  it.each(['\\', '\u00a5', '\uffe5'])('types a backslash with %j', (key) => {
    // A JIS layout sends a yen sign from the key a backslash lives on.
    const session = new TypingSession('a\\b')
    expect(session.press('a')).toBe(true)
    expect(session.press(key)).toBe(true)
    expect(session.press('b')).toBe(true)
    expect(session.state.done).toBe(true)
  })

  it('finishes a line that ends a string with a null byte', () => {
    expect(completes("buf[n] = '\\0';", "buf[n] = '\u00a50';")).toBe(true)
  })
})

describe('non-kana targets', () => {
  it('types latin and symbols as themselves', () => {
    expect(completes('const x = 1', 'const x = 1')).toBe(true)
  })

  it('maps japanese punctuation to its key', () => {
    expect(completes('はい、そうです。', 'hai,soudesu.')).toBe(true)
  })

  it('normalises katakana', () => {
    expect(completes('タイプ', 'taipu')).toBe(true)
    expect(completes('サーバー', 'sa-ba-')).toBe(true)
  })
})

describe('state', () => {
  it('reports the shortest remaining spelling', () => {
    const session = new TypingSession('こんにちは')
    expect(session.state.remaining).toBe('konnnitiha')
    session.press('k')
    expect(session.state.remaining).toBe('onnnitiha')
  })

  it('holds back committed kana until a chunk is finished', () => {
    const session = new TypingSession('きゃく')
    session.press('k')
    expect(session.state.committed).toBe(0)
    session.press('y')
    expect(session.state.committed).toBe(0)
    session.press('a')
    expect(session.state.committed).toBe(2)
  })

  it('commits き on its own once ki rules out kya', () => {
    const session = new TypingSession('きゃく')
    for (const key of 'ki') session.press(key)
    expect(session.state.committed).toBe(1)
    expect(session.state.remaining).toBe('xyaku')
  })

  it('lists the keys that would be accepted next', () => {
    const session = new TypingSession('し')
    expect([...session.state.nextKeys].sort()).toEqual(['c', 's'])
  })

  it('counts mistakes without consuming them', () => {
    const session = new TypingSession('あ')
    expect(session.press('x')).toBe(false)
    expect(session.press('a')).toBe(true)
    expect(session.state).toMatchObject({ done: true, accepted: 1, mistakes: 1 })
  })

  it('ignores input once finished', () => {
    const { session } = feed('あ', 'a')
    expect(session.press('a')).toBe(false)
    expect(session.state.mistakes).toBe(0)
  })

  it('resets', () => {
    const { session } = feed('あい', 'ax')
    session.reset()
    expect(session.state).toMatchObject({ typed: '', mistakes: 0, committed: 0, done: false })
  })
})
