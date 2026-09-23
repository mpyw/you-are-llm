import { describe, expect, it } from 'vitest'
import { ANY, filtersFrom, matches } from './filters'
import { sessionIndex } from './index'

describe('filtersFrom', () => {
  it('opens on Japanese when the address says nothing', () => {
    expect(filtersFrom({}).lang).toBe('ja')
  })

  it('takes both only when the address asks for both', () => {
    expect(filtersFrom({ lang: ANY }).lang).toBe(ANY)
  })

  it('ignores a language it does not know', () => {
    expect(filtersFrom({ lang: 'fr' }).lang).toBe('ja')
  })

  it('leaves the other two off until they are named', () => {
    expect(filtersFrom({}).difficulty).toBeUndefined()
    expect(filtersFrom({ difficulty: 'expertplus' }).difficulty).toBe('expertplus')
    expect(filtersFrom({ code: 'nope' }).code).toBeUndefined()
  })
})

describe('matches', () => {
  it('shows half the set by default, which is the Japanese half', () => {
    const shown = sessionIndex.filter((session) => matches(session, filtersFrom({})))
    expect(shown.length).toBe(sessionIndex.length / 2)
    expect(shown.every((session) => session.language === 'ja')).toBe(true)
  })

  it('shows all of it when asked', () => {
    const shown = sessionIndex.filter((session) => matches(session, filtersFrom({ lang: ANY })))
    expect(shown.length).toBe(sessionIndex.length)
  })

  it('narrows on every axis at once', () => {
    const filters = filtersFrom({ lang: 'en', difficulty: 'expertplus', code: 'rust' })
    const shown = sessionIndex.filter((session) => matches(session, filters))
    expect(shown.map((session) => session.id)).toEqual(['tx-callback-rust-en'])
  })
})
