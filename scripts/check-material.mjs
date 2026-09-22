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

/**
 * Turns of phrase that give an LLM away in Japanese.
 *
 * Four habits. A translation that stopped halfway, praise nobody asked for, a
 * word that only ever arrives through a dictionary, and the sentence furniture
 * that fills the space between them.
 */
export const AI_TELLS = [
  // The translation stopped halfway.
  'Now、',
  "Let's",
  "Here's",
  'Note:',
  'TL;DR',
  'Caveat:',
  'Step 1:',
  'Great',
  'Perfect',
  // Praise nobody asked for.
  '素晴らしい',
  '鋭いご指摘',
  '鋭いです',
  '良い質問',
  'おっしゃるとおり',
  'ご指摘のとおり',
  'まさにその通り',
  '完璧です',
  '承知しました',
  'かしこまりました',
  'よく気づかれました',
  '重要な点を突いて',
  '着眼点',
  // A word that only ever arrives through a dictionary.
  '正本',
  '唯一の情報源',
  '堅牢',
  '優雅に',
  '防御的に',
  'ボイラープレート',
  'ハッピーパス',
  '非自明',
  'べき等',
  '冪等',
  '決定論的',
  '関心の分離',
  '実装の詳細',
  '第一級',
  '直交',
  'アトミック',
  '抽象化の漏れ',
  '技術的負債',
  '銀の弾丸',
  '網羅的',
  // Sentence furniture.
  'を活用し',
  'に注意することが重要です',
  'を保証します',
  '言い換えると',
  '深掘り',
  'しましょう！',
  'お手伝いできること',
  'お知らせください',
  'まとめると',
  '結論から',
  '順を追って',
  '一歩ずつ',
  'ベストプラクティス',
  'ことをお勧めします',
  '期待どおりに動作します',
  'が可能になります',
  'の観点から',
  '以上で',
  'ポイントは',
]

/**
 * The most recognisable habit of the lot. The assistant says it did something,
 * then comes back and admits it did not, or that the thing it just explained
 * was wrong. Any session where the assistant slips has to own it in this voice.
 */
export const SELF_CORRECTIONS = [
  '申し訳ありません',
  '失礼しました',
  '訂正します',
  '訂正させてください',
  '前言を撤回',
  '私の誤りでした',
  '私の理解が誤って',
  '改めて確認したところ',
  '確認したところ',
  '重要な訂正',
  '見落としていました',
  '混乱を招いて',
  '正確ではありませんでした',
  '反映されていませんでした',
  '先ほどの',
  '正しくありませんでした',
]

/**
 * How many distinct tells a Japanese session has to wear, by how much prose it
 * has to wear them on. This used to key off difficulty, which stopped making
 * sense once difficulty came to mean typing load rather than session length: a
 * two block session cannot carry five tells without becoming a parody.
 */
function tellFloor(proseBlocks) {
  if (proseBlocks <= 2) return 3
  if (proseBlocks === 3) return 4
  return 5
}

/** A slip needs somewhere to happen and somewhere to be owned. */
function needsSelfCorrection(proseBlocks) {
  return proseBlocks >= 3
}

const LANGUAGES = new Set(['ja', 'en'])
const DIFFICULTIES = new Set(['easy', 'normal', 'hard', 'veryhard'])
const CODE_LANGUAGES = new Set(['c', 'cpp', 'csharp', 'go', 'java', 'php', 'rust', 'typescript'])
const BLOCK_KINDS = new Set(['text', 'code', 'command'])

/** A katakana word of three or more characters, which has one transcription. */
const KATAKANA_WORD = /[ァ-ヶー]{3,}/gu

/**
 * Kanji cannot be checked without a dictionary. These are the terms that have
 * already been got wrong once, so they never get to be wrong twice. Add to it
 * whenever a reading slips through.
 */
const GLOSSARY = {
  戻り値: 'もどりち',
  返り値: 'かえりち',
  引数: 'ひきすう',
  添字: 'そえじ',
  正本: 'せいほん',
  堅牢: 'けんろう',
  非自明: 'ひじめい',
  第一級: 'だいいっきゅう',
  銀の弾丸: 'ぎんのだんがん',
  冪等: 'べきとう',
  関心の分離: 'かんしんのぶんり',
  決定論的: 'けっていろんてき',
}

function toHiragana(text) {
  let out = ''
  for (const char of text) {
    const code = char.codePointAt(0)
    out += code >= 0x30a1 && code <= 0x30f6 ? String.fromCodePoint(code - 0x60) : char
  }
  return out
}

/**
 * The reading is what gets typed and the body is what is read, so the two have
 * to say the same thing. Nothing used to compare them, and two readings that
 * disagreed with their body shipped.
 */
function readingProblems(body, reading) {
  const said = toHiragana(reading)
  const problems = []
  for (const word of new Set(body.match(KATAKANA_WORD) ?? [])) {
    if (!said.includes(toHiragana(word))) {
      problems.push(`the body says ${word} and the reading does not`)
    }
  }
  for (const [term, kana] of Object.entries(GLOSSARY)) {
    if (body.includes(term) && !reading.includes(kana)) {
      problems.push(`the body says ${term}, which reads ${kana}`)
    }
  }
  return problems
}

const KANA = /[ぁ-ゟァ-ヺ]/u
const ASCII = /[\x20-\x7e\n]/u

/**
 * The typed target is the reading when there is one and the body otherwise, so
 * English prose and every code block get checked the same way.
 */
function targetProblems(target) {
  const bad = new Set()
  for (const char of target) {
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

  if (session.language === 'ja') {
    const blocks = session.turns
      .flatMap((turn) => turn.assistant ?? [])
      .filter((block) => block.kind === 'text')
    const prose = blocks.map((block) => block.body ?? '').join('\n')
    const floor = tellFloor(blocks.length)
    const worn = AI_TELLS.filter((tell) => prose.includes(tell))
    if (worn.length < floor) {
      say(
        `${blocks.length} prose blocks need ${floor} distinct AI tells and have ${worn.length}` +
          `${worn.length > 0 ? ` (${worn.join(', ')})` : ''}`,
      )
    }
    if (needsSelfCorrection(blocks.length)) {
      const owned = SELF_CORRECTIONS.filter((phrase) => prose.includes(phrase))
      if (owned.length === 0) {
        say('the assistant slips in this session, so it needs a self correction phrase')
      }
    }
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
      const target = reading ?? block.body
      const bad = targetProblems(target)
      if (bad.length > 0) {
        say(`${here}.${reading === null ? 'body' : 'reading'} cannot be typed: ${bad.join(' ')}`)
      }
      if (reading !== null) {
        for (const problem of readingProblems(block.body, reading)) {
          say(`${here}.reading disagrees with the body: ${problem}`)
        }
      }
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
