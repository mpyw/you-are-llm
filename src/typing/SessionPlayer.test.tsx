// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { TypingSession } from '../engine'
import type { Session } from '../materials'
import { SessionPlayer } from './SessionPlayer'

afterEach(cleanup)

const SESSION: Session = {
  id: 'test',
  title: 'Test session',
  language: 'ja',
  summary: 'Two steps.',
  files: [{ path: 'src/a.ts', content: 'export const a = 1\n' }],
  turns: [
    {
      user: 'リトライを足して。',
      assistant: [
        { kind: 'text', body: '入れます。', reading: 'いれます。', lang: null },
        { kind: 'command', body: 'ls -a', reading: null, lang: null },
      ],
    },
  ],
}

function press(key: string): void {
  act(() => {
    window.dispatchEvent(
      new KeyboardEvent('keydown', { key: key === '\n' ? 'Enter' : key, cancelable: true }),
    )
  })
}

/** The shortest key sequence that finishes `target`, as the engine sees it. */
function keysFor(target: string): string {
  return new TypingSession(target).state.remaining
}

function typeTarget(target: string): void {
  for (const key of keysFor(target)) press(key)
}

describe('SessionPlayer', () => {
  it('shows the prompt and the first target', () => {
    render(<SessionPlayer session={SESSION} />)
    expect(screen.getByText('リトライを足して。')).toBeDefined()
    expect(screen.getByText('入れます。')).toBeDefined()
    expect(screen.getByText('0 / 2')).toBeDefined()
  })

  it('advances one step per completed block', () => {
    render(<SessionPlayer session={SESSION} />)
    typeTarget('いれます。')
    expect(screen.getByText('1 / 2')).toBeDefined()
    // The target renders as a typed span plus an untyped span, so it is not unique.
    expect(screen.getAllByText('ls -a').length).toBeGreaterThan(0)
  })

  it('reports a clean run', () => {
    render(<SessionPlayer session={SESSION} />)
    typeTarget('いれます。')
    typeTarget('ls -a')
    expect(screen.getByText('Session complete')).toBeDefined()
    expect(screen.getByText('100%')).toBeDefined()
    expect(screen.getByText('2 / 2')).toBeDefined()
  })

  it('counts a rejected key without advancing', () => {
    render(<SessionPlayer session={SESSION} />)
    press('z')
    expect(screen.getByText('0 / 2')).toBeDefined()
    typeTarget('いれます。')
    typeTarget('ls -a')
    const mistakes = screen.getByText('Mistakes').nextElementSibling
    expect(mistakes?.textContent).toBe('1')
  })

  it('restarts from the beginning', () => {
    render(<SessionPlayer session={SESSION} />)
    typeTarget('いれます。')
    typeTarget('ls -a')
    act(() => {
      screen.getByRole('button', { name: 'Type it again' }).click()
    })
    expect(screen.getByText('0 / 2')).toBeDefined()
  })
})
