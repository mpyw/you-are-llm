// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { Thinking } from './Thinking'

afterEach(cleanup)

describe('Thinking', () => {
  it('counts down the keys left while the block runs', () => {
    render(<Thinking active remaining={128} />)
    expect(screen.getByText('128 left')).toBeDefined()
  })

  it('settles once the block is finished', () => {
    render(<Thinking active={false} remaining={0} />)
    expect(screen.getByText('Done')).toBeDefined()
    expect(screen.queryByText(/left/)).toBeNull()
  })
})
