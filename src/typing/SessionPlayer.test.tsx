// @vitest-environment jsdom
import { act, cleanup, render, screen, within } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { TypingSession } from '../engine'
import type { Session } from '../materials'
import { SessionPlayer } from './SessionPlayer'

beforeAll(() => {
  // jsdom does no layout, so it ships no scrollIntoView for the caret to use.
  Element.prototype.scrollIntoView = vi.fn()
})

afterEach(cleanup)

const SESSION: Session = {
  id: 'test',
  title: 'Test session',
  language: 'ja',
  difficulty: 'easy',
  codeLanguage: 'typescript',
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

function panel(root: HTMLElement, selector: string): HTMLElement {
  const found = root.querySelector<HTMLElement>(selector)
  if (found === null) throw new Error(`no ${selector} on screen`)
  return found
}

/**
 * Reads a labelled figure. The display and the result share several labels, so
 * every lookup names which of the two it means.
 */
function figure(root: HTMLElement, selector: string, label: string): string {
  return within(panel(root, selector)).getByText(label).nextElementSibling?.textContent ?? ''
}

function stepsDone(): string {
  return screen.getByRole('progressbar').getAttribute('aria-valuenow') ?? ''
}

describe('SessionPlayer', () => {
  it('shows the prompt and the first target', () => {
    render(<SessionPlayer session={SESSION} />)
    expect(screen.getByText('リトライを足して。')).toBeDefined()
    expect(screen.getByText('入れます。')).toBeDefined()
    expect(stepsDone()).toBe('0')
  })

  it('advances one step per completed block', () => {
    render(<SessionPlayer session={SESSION} />)
    typeTarget('いれます。')
    expect(stepsDone()).toBe('1')
    // The target renders as a typed span plus an untyped span, so it is not unique.
    expect(screen.getAllByText('ls -a').length).toBeGreaterThan(0)
  })

  it('folds a finished block into the log instead of stacking it', () => {
    const { container } = render(<SessionPlayer session={SESSION} />)
    typeTarget('いれます。')
    const stage = panel(container, '.stage')
    const log = panel(container, '.log')
    // The finished block leaves the stage so the page keeps its height.
    expect(within(log).getByText('入れます。')).toBeDefined()
    expect(within(stage).queryByText('入れます。')).toBeNull()
    // The prompt stays on the stage, because it still applies to this block.
    expect(within(stage).getByText('リトライを足して。')).toBeDefined()
  })

  it('reports a clean run', () => {
    const { container } = render(<SessionPlayer session={SESSION} />)
    typeTarget('いれます。')
    typeTarget('ls -a')
    expect(stepsDone()).toBe('2')
    expect(figure(container, '.hud', 'Accuracy')).toBe('100%')
    expect(figure(container, '.result', 'Mistakes')).toBe('0')
  })

  it('grades the run', () => {
    const { container } = render(<SessionPlayer session={SESSION} />)
    typeTarget('いれます。')
    typeTarget('ls -a')
    // Typed instantly, so the speed floor is cleared and only accuracy decides.
    expect(within(panel(container, '.result-rank')).getByText('S')).toBeDefined()
    expect(screen.getByText('Nothing to correct')).toBeDefined()
  })

  it('builds a combo and drops it on a mistake', () => {
    const { container } = render(<SessionPlayer session={SESSION} />)
    for (const key of keysFor('いれます。').slice(0, 4)) press(key)
    expect(figure(container, '.hud', 'Combo')).toBe('×4')
    expect(figure(container, '.hud', 'Best')).toBe('×4')

    press('@')
    expect(figure(container, '.hud', 'Combo')).toBe('×0')
    expect(figure(container, '.hud', 'Best')).toBe('×4')
  })

  it('loses nothing when keys arrive faster than a render', () => {
    const { container } = render(<SessionPlayer session={SESSION} />)
    // One act for the whole burst, so React never re-renders between keys.
    act(() => {
      for (const key of keysFor('いれます。') + keysFor('ls -a')) {
        window.dispatchEvent(new KeyboardEvent('keydown', { key, cancelable: true }))
      }
    })
    expect(stepsDone()).toBe('2')
    expect(figure(container, '.hud', 'Accuracy')).toBe('100%')
  })

  it('hands a key typed right after a block to the next one', () => {
    const { container } = render(<SessionPlayer session={SESSION} />)
    typeTarget('いれます。')
    const before = keysFor('いれます。').length
    // `l` opens the next block, so it lands rather than falling in the gap.
    press('l')
    expect(figure(container, '.hud', 'Accuracy')).toBe('100%')
    expect(figure(container, '.hud', 'Combo')).toBe(`×${String(before + 1)}`)
  })

  it('counts a rejected key without advancing', () => {
    const { container } = render(<SessionPlayer session={SESSION} />)
    press('@')
    expect(stepsDone()).toBe('0')
    typeTarget('いれます。')
    typeTarget('ls -a')
    expect(figure(container, '.result', 'Mistakes')).toBe('1')
  })

  it('restarts from the beginning', () => {
    const { container } = render(<SessionPlayer session={SESSION} />)
    typeTarget('いれます。')
    typeTarget('ls -a')
    act(() => {
      screen.getByRole('button', { name: 'Type it again' }).click()
    })
    expect(stepsDone()).toBe('0')
    expect(figure(container, '.hud', 'Best')).toBe('×0')
  })
})
