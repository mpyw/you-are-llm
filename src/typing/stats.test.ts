import { describe, expect, it } from 'vitest'
import { accuracy, formatDuration, keysPerMinute, rank } from './stats'

const minute = 60_000

describe('keysPerMinute', () => {
  it('counts accepted keys against elapsed time', () => {
    expect(keysPerMinute({ accepted: 300, mistakes: 0, elapsedMs: minute })).toBe(300)
    expect(keysPerMinute({ accepted: 150, mistakes: 0, elapsedMs: minute / 2 })).toBe(300)
  })

  it('is zero before the clock starts', () => {
    expect(keysPerMinute({ accepted: 10, mistakes: 0, elapsedMs: 0 })).toBe(0)
  })
})

describe('accuracy', () => {
  it('is a share of every press', () => {
    expect(accuracy({ accepted: 90, mistakes: 10, elapsedMs: minute })).toBe(90)
  })

  it('is full before anything is typed', () => {
    expect(accuracy({ accepted: 0, mistakes: 0, elapsedMs: 0 })).toBe(100)
  })
})

describe('formatDuration', () => {
  it.each([
    [0, '0:00'],
    [9_400, '0:09'],
    [65_000, '1:05'],
    [600_000, '10:00'],
  ])('renders %i as %s', (ms, shown) => {
    expect(formatDuration(ms)).toBe(shown)
  })
})

describe('rank', () => {
  it('needs both speed and accuracy', () => {
    expect(rank({ accepted: 400, mistakes: 0, elapsedMs: minute })).toBe('S')
    // Same speed, sloppier: the S accuracy floor is missed.
    expect(rank({ accepted: 400, mistakes: 20, elapsedMs: minute })).toBe('A')
  })

  it('does not reward accuracy alone', () => {
    expect(rank({ accepted: 50, mistakes: 0, elapsedMs: minute })).toBe('D')
  })

  it('lands on D when nothing is cleared', () => {
    expect(rank({ accepted: 90, mistakes: 90, elapsedMs: minute })).toBe('D')
  })
})
