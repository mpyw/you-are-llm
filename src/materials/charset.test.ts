import { describe, expect, it } from 'vitest'
import { untypeableCharacters } from '../engine'
// The authoring script inlines its allowlist so it can run without the app.
// This test keeps that list from drifting away from the keyboard layout.
import { ALLOWED_PUNCTUATION } from '../../scripts/check-material.mjs'

describe('authoring allowlist', () => {
  it('names only characters the layout can type', () => {
    const offenders: string[] = []
    for (const char of ALLOWED_PUNCTUATION) offenders.push(...untypeableCharacters(char))
    expect(offenders).toEqual([])
  })

  it('is not empty', () => {
    expect(ALLOWED_PUNCTUATION.length).toBeGreaterThan(0)
  })
})
