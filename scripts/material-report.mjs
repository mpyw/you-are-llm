#!/usr/bin/env node
// What material exists right now, and the numbers that are written down
// elsewhere and have to be updated when it changes.

import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'

const DIR = 'src/materials/sessions'
const ORDER = ['easy', 'normal', 'hard', 'expert', 'expertplus']

function load() {
  return readdirSync(DIR)
    .filter((name) => name.endsWith('.json'))
    .map((name) => ({ name, ...JSON.parse(readFileSync(join(DIR, name), 'utf8')) }))
}

/** `retry-typescript-easy-ja` is the retry topic. The rest is metadata. */
function topicOf(session) {
  return session.id.replace(new RegExp(`-${session.codeLanguage}-${session.language}$`), '')
}

function main() {
  const sessions = load()
  const languages = [...new Set(sessions.map((s) => s.codeLanguage))].sort()

  console.log(`${sessions.length} sessions in ${DIR}\n`)

  const width = Math.max(...languages.map((l) => l.length), 8)
  console.log(`${'language'.padEnd(width)}  ${ORDER.map((d) => d.padEnd(9)).join('')} topics`)
  for (const language of languages) {
    const mine = sessions.filter((s) => s.codeLanguage === language)
    const counts = ORDER.map((d) =>
      String(mine.filter((s) => s.difficulty === d).length).padEnd(9),
    ).join('')
    const topics = [...new Set(mine.map(topicOf))].sort().join(', ')
    console.log(`${language.padEnd(width)}  ${counts}${topics}`)
  }

  const gaps = []
  for (const language of languages) {
    for (const difficulty of ORDER) {
      for (const natural of ['ja', 'en']) {
        const found = sessions.filter(
          (s) =>
            s.codeLanguage === language && s.difficulty === difficulty && s.language === natural,
        ).length
        const other = sessions.filter(
          (s) =>
            s.codeLanguage === language && s.difficulty === difficulty && s.language !== natural,
        ).length
        if (found !== other) gaps.push(`${language} ${difficulty} ${natural}: ${found} vs ${other}`)
      }
    }
  }
  console.log(`\nja and en in step: ${gaps.length === 0 ? 'yes' : `no (${gaps.join('; ')})`}`)

  console.log('\nThese numbers are written down by hand. Update them together:')
  console.log(`  scripts/og.html          <b>${sessions.length}</b> sessions`)
  console.log(`  index.html               og:description and twitter:description`)
  console.log(`  README.md                the Status section`)
  console.log(`  GitHub description       gh repo edit --description "..."`)
  console.log('\nThen render both preview images again, per docs/social-preview.md.')
}

main()
process.exitCode = 0
