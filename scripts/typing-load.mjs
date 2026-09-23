#!/usr/bin/env node
// How hard each session is to type, and what difficulty that earns it.
//
//   node scripts/typing-load.mjs            report only
//   node scripts/typing-load.mjs --apply    write the grades back
//
// The score is how hard a session is per keystroke, stretched a little by how
// much of it there is.
//
// Hardness is the share of keys that need Shift, times the number of distinct
// symbol shapes the session asks for. Shapes are what separate Rust from PHP:
// PHP types more symbols, but `$` and `->` are most of them, learned once. Rust
// spends the same weight across `&mut`, `::`, `<'a>`, `?` and a dozen others.
//
// Length counts symbol keystrokes rather than all of them. A session is not
// harder for spelling out `htmlspecialchars`, which is the easiest kind of key
// there is, and counting every character rewarded exactly that.

import { readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'

const DIR = 'src/materials/sessions'

/** Keys that need Shift on a US layout. They cost about twice as much. */
const SHIFTED = new Set([...'~!@#$%^&*()_+{}|:"<>?', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'])

/** Runs of punctuation. An underscore inside a name is part of the word. */
const SYMBOL_RUN = /[`~!@#$%^&*()\-=+[\]{}\\|;:'",.<>/?]+/gu
const NAME_UNDERSCORE = /(?<=[0-9A-Za-z])_(?=[0-9A-Za-z])/gu

/**
 * A token this share of the languages uses is one every typist already knows.
 * It used to be a fixed count of seven, picked when there were eight languages.
 * Each language added made seven a smaller share, more tokens counted as known,
 * and every score drifted down: the one Expert+ session fell from 41.9 to 37.0
 * over four batches without a keystroke of it changing.
 */
const UNIVERSAL_SHARE = 7 / 8

/** How much each distinct symbol shape adds to the hardness of a keystroke. */
const VARIETY_WEIGHT = 0.05

/** How much the length of a session counts. Well under one, on purpose. */
const LENGTH_EXPONENT = 0.45

/** Upper bound of each tier. */
const TIERS = [
  { limit: 11, name: 'easy' },
  { limit: 16, name: 'normal' },
  { limit: 22, name: 'hard' },
  { limit: 34, name: 'expert' },
  { limit: Infinity, name: 'expertplus' },
]

function load() {
  return readdirSync(DIR)
    .filter((name) => name.endsWith('.json'))
    .map((name) => ({ file: name, data: JSON.parse(readFileSync(join(DIR, name), 'utf8')) }))
}

const SYMBOL = new Set([...'`~!@#$%^&*()-=+[]{}\\|;:\'",.<>/?'])

/** Keys, keys that need Shift, and keys that are punctuation rather than a name. */
function countsOf(session) {
  let keys = 0
  let shifted = 0
  let symbols = 0
  for (const turn of session.turns) {
    for (const block of turn.assistant) {
      const target = block.reading ?? block.body
      keys += target.length
      for (const char of target) if (SHIFTED.has(char)) shifted += 1
      for (const char of target.replaceAll(NAME_UNDERSCORE, '\u0000')) {
        if (SYMBOL.has(char)) symbols += 1
      }
    }
  }
  return { keys, shifted, symbols }
}

/** Symbol runs in the code of one session, counted. Prose has no shapes to learn. */
function symbolRuns(session) {
  const runs = new Map()
  for (const turn of session.turns) {
    for (const block of turn.assistant) {
      if (block.kind === 'text') continue
      for (const [run] of block.body.replaceAll(NAME_UNDERSCORE, '\u0000').matchAll(SYMBOL_RUN)) {
        runs.set(run, (runs.get(run) ?? 0) + 1)
      }
    }
  }
  return runs
}

/** Tokens that show up across the corpus are muscle memory, not difficulty. */
function universalTokens(sessions) {
  const languages = new Map()
  for (const { data } of sessions) {
    for (const run of symbolRuns(data).keys()) {
      const seen = languages.get(run) ?? new Set()
      seen.add(data.codeLanguage)
      languages.set(run, seen)
    }
  }
  const everyLanguage = new Set(sessions.map(({ data }) => data.codeLanguage))
  const needed = Math.ceil(everyLanguage.size * UNIVERSAL_SHARE)
  return new Set(
    [...languages.entries()].filter(([, seen]) => seen.size >= needed).map(([run]) => run),
  )
}

/**
 * The effective number of distinct symbol shapes, which is two to the power of
 * the entropy. Twenty shapes used evenly score twenty. Twenty shapes where one
 * of them is nearly all of the traffic score close to one, which is what makes
 * `$` cheap however often it turns up.
 */
function varietyOf(session, universal) {
  const runs = [...symbolRuns(session)].filter(([run]) => !universal.has(run))
  const total = runs.reduce((sum, [, count]) => sum + count, 0)
  if (total === 0) return 1
  let entropy = 0
  for (const [, count] of runs) {
    const share = count / total
    entropy -= share * Math.log2(share)
  }
  return 2 ** entropy
}

function effortOf(session, universal) {
  const { keys, shifted, symbols } = countsOf(session)
  if (keys === 0) return 0
  const hardness = (1 + shifted / keys) * (1 + VARIETY_WEIGHT * varietyOf(session, universal))
  return Math.round(hardness * symbols ** LENGTH_EXPONENT * 10) / 10
}

/** The id may or may not still carry the difficulty. Both forms reduce to the topic. */
function topicOf(session) {
  const { id, codeLanguage, difficulty, language } = session
  const dated = `-${codeLanguage}-${difficulty}-${language}`
  const plain = `-${codeLanguage}-${language}`
  if (id.endsWith(dated)) return id.slice(0, -dated.length)
  if (id.endsWith(plain)) return id.slice(0, -plain.length)
  throw new Error(`${id} does not follow the naming convention`)
}

function grade(effort) {
  return TIERS.find((tier) => effort < tier.limit).name
}

function group(sessions, universal) {
  const scenarios = new Map()
  for (const entry of sessions) {
    const key = `${topicOf(entry.data)}-${entry.data.codeLanguage}`
    scenarios.set(key, [...(scenarios.get(key) ?? []), entry])
  }
  // Both halves of a scenario share a grade, from the average, so the grid stays even.
  return [...scenarios.entries()]
    .map(([key, entries]) => ({
      key,
      entries,
      effort:
        Math.round(
          (entries.reduce((sum, e) => sum + effortOf(e.data, universal), 0) / entries.length) * 10,
        ) / 10,
      variety: varietyOf(entries[0].data, universal),
    }))
    .sort((left, right) => left.effort - right.effort)
}

function report(rows) {
  console.log(
    `${'effort'.padStart(7)}${'shapes'.padStart(8)}  ${'language'.padEnd(11)}${'scenario'.padEnd(24)}grade`,
  )
  let moved = 0
  for (const { key, entries, effort, variety } of rows) {
    const now = entries[0].data.difficulty
    const next = grade(effort)
    if (now !== next) moved += 1
    const { codeLanguage } = entries[0].data
    const topic = key.slice(0, -(codeLanguage.length + 1))
    const arrow = now === next ? '' : `  ${now} -> ${next}`
    console.log(
      `${effort.toFixed(1).padStart(7)}${variety.toFixed(1).padStart(8)}  ` +
        `${codeLanguage.padEnd(11)}${topic.padEnd(24)}${next}${arrow}`,
    )
  }
  const counts = {}
  for (const { effort } of rows) counts[grade(effort)] = (counts[grade(effort)] ?? 0) + 1
  console.log(`\n${rows.length} scenarios, ${moved} would move`)
  for (const tier of TIERS) console.log(`  ${tier.name.padEnd(10)}${counts[tier.name] ?? 0}`)
}

/**
 * Writes the grade back and drops the difficulty out of the id. An id has to
 * survive a re-grade, because it is in the URL people share.
 */
function apply(rows) {
  let touched = 0
  for (const { entries, effort } of rows) {
    const difficulty = grade(effort)
    for (const { file, data } of entries) {
      const id = `${topicOf(data)}-${data.codeLanguage}-${data.language}`
      if (data.difficulty === difficulty && data.id === id) continue
      const next = { ...data, id, difficulty }
      const ordered = {}
      for (const field of Object.keys(data)) ordered[field] = next[field]
      writeFileSync(join(DIR, file), `${JSON.stringify(ordered, null, 2)}\n`)
      if (file !== `${id}.json`) renameSync(join(DIR, file), join(DIR, `${id}.json`))
      touched += 1
    }
  }
  console.log(`\nwrote ${touched} files`)
}

const all = load()
const rows = group(all, universalTokens(all))
report(rows)
if (process.argv.includes('--apply')) apply(rows)
