import { describe, expect, it } from 'vitest'
import { validate } from '../../scripts/check-material.mjs'
import { TypingSession, untypeableCharacters } from '../engine'
import { toSteps } from '../typing/steps'
import { sessions } from './index'
import { parseSession } from './parse'
import type { Difficulty } from './types'

/** Slack around the budget in FORMAT.md, wide enough to allow judgement. */
const BLOCK_BUDGET: Readonly<Record<Difficulty, readonly [number, number]>> = {
  easy: [3, 5],
  normal: [4, 8],
  hard: [7, 12],
}

const files = import.meta.glob<unknown>('./sessions/*.json', { eager: true, import: 'default' })

describe('the material set', () => {
  it('is not empty', () => {
    expect(sessions.length).toBeGreaterThan(0)
  })

  it('gives every session a unique id', () => {
    const ids = sessions.map((session) => session.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('names every file after the id inside it', () => {
    const mismatched = Object.entries(files)
      .map(([path, raw]) => ({ path, id: parseSession(raw).id }))
      .filter(({ path, id }) => path !== `./sessions/${id}.json`)
    expect(mismatched).toEqual([])
  })
})

describe.each(sessions.map((session) => [session.id, session] as const))('%s', (_id, session) => {
  const steps = toSteps(session)

  it('passes the authoring checker', () => {
    // `scripts/check-material.mjs` owns the hand written rules, including the
    // AI voice. Calling it here keeps one copy of them.
    expect(validate(files[`./sessions/${session.id}.json`])).toEqual([])
  })

  it('can be typed from start to finish', () => {
    for (const step of steps) {
      const typing = new TypingSession(step.target)
      const keys = typing.state.remaining
      expect(keys.length, `empty target in ${session.id}`).toBeGreaterThan(0)
      for (const key of keys) {
        expect(typing.press(key), `rejected ${key} in ${session.id}`).toBe(true)
      }
      expect(typing.state.done).toBe(true)
    }
  })

  it('holds no character the keyboard cannot produce', () => {
    const offenders = steps.flatMap((step) => untypeableCharacters(step.target))
    expect([...new Set(offenders)]).toEqual([])
  })

  it('stays inside the block budget for its difficulty', () => {
    const [low, high] = BLOCK_BUDGET[session.difficulty]
    expect(steps.length).toBeGreaterThanOrEqual(low)
    expect(steps.length).toBeLessThanOrEqual(high)
  })

  it('edits the source with a command when it is not easy', () => {
    if (session.difficulty === 'easy') return
    const commands = steps.filter((step) => step.block.kind === 'command')
    expect(commands.length).toBeGreaterThan(0)
  })
})

describe('parseSession', () => {
  const base = {
    id: 'x',
    title: 't',
    language: 'ja',
    difficulty: 'easy',
    codeLanguage: 'rust',
    summary: 's',
    files: [],
    turns: [],
  }

  it('names the field that is wrong', () => {
    expect(() => parseSession({ ...base, turns: [{}] })).toThrow(
      'material: x.turns[0].user must be a string',
    )
  })

  it('rejects an unknown language', () => {
    expect(() => parseSession({ ...base, language: 'fr' })).toThrow(
      'material: x.language must be ja or en',
    )
  })

  it('rejects an unknown code language', () => {
    expect(() => parseSession({ ...base, codeLanguage: 'cobol' })).toThrow(
      'material: x.codeLanguage must be',
    )
  })
})
