#!/usr/bin/env node
// Mechanical checks for hand written session material.
//
// This is the fast loop for whoever is writing material. The authoritative
// check is `pnpm test`, which also runs every target through the engine.

import { readFile } from 'node:fs/promises'
import process from 'node:process'

/**
 * Punctuation a Japanese `reading` may contain on top of kana and ASCII.
 * `src/materials/charset.test.ts` proves the keyboard layout covers all of it.
 */
export const ALLOWED_PUNCTUATION = '、。「」『』（）！？：；・ー〜～，．　'

const LANGUAGES = new Set(['ja', 'en'])
const DIFFICULTIES = new Set(['easy', 'normal', 'hard'])
const CODE_LANGUAGES = new Set(['c', 'cpp', 'csharp', 'go', 'java', 'php', 'rust', 'typescript'])
const BLOCK_KINDS = new Set(['text', 'code', 'command'])

const KANA = /[ぁ-ゟァ-ヺ]/u
const ASCII = /[\x20-\x7e\n]/u

function readingProblems(reading) {
  const bad = new Set()
  for (const char of reading) {
    if (ASCII.test(char)) continue
    if (KANA.test(char)) continue
    if (ALLOWED_PUNCTUATION.includes(char)) continue
    bad.add(char)
  }
  return [...bad]
}

export function validate(session) {
  const problems = []
  const say = (message) => problems.push(message)

  for (const field of ['id', 'title', 'summary']) {
    if (typeof session[field] !== 'string' || session[field].length === 0) {
      say(`${field} must be a non-empty string`)
    }
  }
  if (!LANGUAGES.has(session.language)) say(`language must be one of ${[...LANGUAGES].join(', ')}`)
  if (!DIFFICULTIES.has(session.difficulty)) {
    say(`difficulty must be one of ${[...DIFFICULTIES].join(', ')}`)
  }
  if (!CODE_LANGUAGES.has(session.codeLanguage)) {
    say(`codeLanguage must be one of ${[...CODE_LANGUAGES].join(', ')}`)
  }
  if (!Array.isArray(session.files) || session.files.length === 0) {
    say('files must hold at least one source file')
  }
  if (!Array.isArray(session.turns) || session.turns.length === 0) {
    say('turns must hold at least one turn')
    return problems
  }

  session.turns.forEach((turn, turnIndex) => {
    const at = `turns[${turnIndex}]`
    if (typeof turn.user !== 'string' || turn.user.length === 0) {
      say(`${at}.user must be a non-empty string`)
    }
    if (!Array.isArray(turn.assistant) || turn.assistant.length === 0) {
      say(`${at}.assistant must hold at least one block`)
      return
    }
    turn.assistant.forEach((block, blockIndex) => {
      const here = `${at}.assistant[${blockIndex}]`
      if (!BLOCK_KINDS.has(block.kind)) say(`${here}.kind must be one of ${[...BLOCK_KINDS].join(', ')}`)
      if (typeof block.body !== 'string' || block.body.length === 0) {
        say(`${here}.body must be a non-empty string`)
        return
      }
      const needsReading = session.language === 'ja' && block.kind === 'text'
      const reading = block.reading ?? null
      if (needsReading && reading === null) {
        say(`${here}.reading is required: a japanese text block is typed as kana`)
        return
      }
      if (!needsReading && reading !== null) {
        say(`${here}.reading must be absent: ${block.kind} blocks are typed as they stand`)
        return
      }
      if (reading === null) return
      const bad = readingProblems(reading)
      if (bad.length > 0) say(`${here}.reading cannot be typed: ${bad.join(' ')}`)
    })
  })

  return problems
}

async function main(paths) {
  let failed = false
  for (const path of paths) {
    let session
    try {
      session = JSON.parse(await readFile(path, 'utf8'))
    } catch (error) {
      console.error(`${path}: not valid JSON: ${error.message}`)
      failed = true
      continue
    }
    const problems = validate(session)
    if (problems.length === 0) {
      console.log(`${path}: ok`)
      continue
    }
    failed = true
    for (const problem of problems) console.error(`${path}: ${problem}`)
  }
  process.exitCode = failed ? 1 : 0
}

if (process.argv[1]?.endsWith('check-material.mjs')) {
  await main(process.argv.slice(2))
}
