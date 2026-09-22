// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ShareRow } from './ShareRow'
import type { ShareCard } from './share'
import { clipboardText } from './share'

afterEach(cleanup)

const CARD: ShareCard = {
  title: 'Add a retry to fetchUser',
  rank: 'A',
  keysPerMinute: 312,
  accuracy: 97,
  bestCombo: 140,
}

function withClipboard(writeText: () => Promise<void>): void {
  Object.defineProperty(globalThis.navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  })
}

describe('ShareRow', () => {
  it('links out to each service in a new tab', () => {
    render(<ShareRow card={CARD} />)
    for (const name of ['X', 'Bluesky', 'Facebook']) {
      const link = screen.getByRole('link', { name })
      expect(link.getAttribute('target')).toBe('_blank')
      expect(link.getAttribute('rel')).toBe('noopener noreferrer')
    }
  })

  it('copies the boast and the link together', async () => {
    const writeText = vi.fn(() => Promise.resolve())
    withClipboard(writeText)
    render(<ShareRow card={CARD} />)

    await act(async () => {
      screen.getByRole('button', { name: 'Copy' }).click()
      await Promise.resolve()
    })

    expect(writeText).toHaveBeenCalledWith(clipboardText(CARD, window.location.href))
    expect(screen.getByRole('button', { name: 'Copied' })).toBeDefined()
  })

  it('says so when the clipboard refuses', async () => {
    withClipboard(() => Promise.reject(new Error('denied')))
    render(<ShareRow card={CARD} />)

    await act(async () => {
      screen.getByRole('button', { name: 'Copy' }).click()
      await Promise.resolve()
    })

    expect(screen.getByRole('button', { name: 'Copy failed' })).toBeDefined()
  })
})
