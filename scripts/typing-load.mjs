#!/usr/bin/env node
// How hard each session is to type, and what difficulty that earns it.
//
//   node scripts/typing-load.mjs            report only
//   node scripts/typing-load.mjs --apply    write the grades back
//
// Difficulty used to be judged inside one language, which made an easy Rust
// session harder to type than a normal Java one. It is measured across the
// whole set now.

import { readFileSync, readdirSync, renameSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import process from 'node:process'

const DIR = 'src/materials/sessions'

/** Keys that need Shift on a US layout. They cost about twice as much. */
const SHIFTED = new Set([...'~!@#$%^&*()_+{}|:"<>?', ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'])

/** Upper bound of each tier, in weighted keystrokes per scenario. */
const TIERS = [
  { limit: 900, name: 'easy' },
  { limit: 1600, name: 'normal' },
  { limit: 2600, name: 'hard' },
  { limit: Infinity, name: 'veryhard' },
]

function load() {
  return readdirSync(DIR)
    .filter((name) => name.endsWith('.json'))
    .map((name) => ({ file: name, data: JSON.parse(readFileSync(join(DIR, name), 'utf8')) }))
}

/** Weighted keystrokes: every key counts once, and a shifted key counts twice. */
function effortOf(session) {
  let keys = 0
  let shifted = 0
  for (const turn of session.turns) {
    for (const block of turn.assistant) {
      const target = block.reading ?? block.body
      keys += target.length
      for (const char of target) if (SHIFTED.has(char)) shifted += 1
    }
  }
  return keys + shifted
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

function group(sessions) {
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
      effort: Math.round(entries.reduce((sum, e) => sum + effortOf(e.data), 0) / entries.length),
    }))
    .sort((left, right) => left.effort - right.effort)
}

function report(rows) {
  console.log(`${'effort'.padStart(7)}  ${'language'.padEnd(11)}${'scenario'.padEnd(24)}now -> next`)
  let moved = 0
  for (const { key, entries, effort } of rows) {
    const now = entries[0].data.difficulty
    const next = grade(effort)
    if (now !== next) moved += 1
    const arrow = now === next ? '' : `  ${now} -> ${next}`
    const { codeLanguage } = entries[0].data
    const topic = key.slice(0, -(codeLanguage.length + 1))
    console.log(
      `${String(effort).padStart(7)}  ${codeLanguage.padEnd(11)}${topic.padEnd(24)}${next}${arrow}`,
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
      // Keep the field order the authors see.
      const ordered = {}
      for (const field of Object.keys(data)) ordered[field] = next[field]
      writeFileSync(join(DIR, file), `${JSON.stringify(ordered, null, 2)}\n`)
      if (file !== `${id}.json`) renameSync(join(DIR, file), join(DIR, `${id}.json`))
      touched += 1
    }
  }
  console.log(`\nwrote ${touched} files`)
}

const rows = group(load())
report(rows)
if (process.argv.includes('--apply')) apply(rows)
