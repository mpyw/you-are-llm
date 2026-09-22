import { describe, expect, it } from 'vitest'
import { TypingSession } from '../engine'
import { toSteps } from '../typing/steps'
import { sessions } from './index'
import { parseSession } from './parse'

const KANJI = /\p{Script=Han}/u

describe.each(sessions.map((session) => [session.id, session] as const))('%s', (_id, session) => {
  const steps = toSteps(session)

  it('has steps', () => {
    expect(steps.length).toBeGreaterThan(0)
  })

  it.each(steps.map((step, index) => [index, step] as const))(
    'step %i can be typed to the end',
    (_index, step) => {
      const typing = new TypingSession(step.target)
      const keys = typing.state.remaining
      expect(keys.length).toBeGreaterThan(0)
      for (const key of keys) expect(typing.press(key)).toBe(true)
      expect(typing.state.done).toBe(true)
    },
  )

  it('leaves no kanji in a japanese target', () => {
    if (session.language !== 'ja') return
    const offenders = steps.filter((step) => KANJI.test(step.target))
    expect(offenders.map((step) => step.target)).toEqual([])
  })
})

describe('parseSession', () => {
  it('names the field that is wrong', () => {
    const broken = { id: 'x', title: 't', language: 'ja', summary: 's', files: [], turns: [{}] }
    expect(() => parseSession(broken)).toThrow('material: x.turns[0].user must be a string')
  })

  it('rejects an unknown language', () => {
    const broken = { id: 'x', title: 't', language: 'fr', summary: 's', files: [], turns: [] }
    expect(() => parseSession(broken)).toThrow('material: x.language must be ja or en')
  })
})
