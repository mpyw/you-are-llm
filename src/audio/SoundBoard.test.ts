import { describe, expect, it } from 'vitest'
import { SoundBoard } from './SoundBoard'

describe('SoundBoard', () => {
  it('stays quiet where Web Audio is missing', () => {
    const board = new SoundBoard()
    expect(() => {
      board.play('key')
      board.play('finish', 12)
    }).not.toThrow()
  })

  it('remembers being muted', () => {
    const board = new SoundBoard()
    expect(board.isMuted).toBe(false)
    board.mute(true)
    expect(board.isMuted).toBe(true)
    board.mute(false)
    expect(board.isMuted).toBe(false)
  })
})
