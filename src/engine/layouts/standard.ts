import type { Layout, Spelling } from '../types'

const plain = (text: string): Spelling => ({ text, requiresConsonantNext: false })

/** Single kana and the key sequences a mainstream IME accepts for each. */
const MONOGRAPHS: Record<string, readonly string[]> = {
  あ: ['a'], い: ['i', 'yi'], う: ['u', 'wu', 'whu'], え: ['e'], お: ['o'],
  か: ['ka', 'ca'], き: ['ki'], く: ['ku', 'cu', 'qu'], け: ['ke'], こ: ['ko', 'co'],
  さ: ['sa'], し: ['si', 'shi', 'ci'], す: ['su'], せ: ['se', 'ce'], そ: ['so'],
  た: ['ta'], ち: ['ti', 'chi'], つ: ['tu', 'tsu'], て: ['te'], と: ['to'],
  な: ['na'], に: ['ni'], ぬ: ['nu'], ね: ['ne'], の: ['no'],
  は: ['ha'], ひ: ['hi'], ふ: ['hu', 'fu'], へ: ['he'], ほ: ['ho'],
  ま: ['ma'], み: ['mi'], む: ['mu'], め: ['me'], も: ['mo'],
  や: ['ya'], ゆ: ['yu'], よ: ['yo'],
  ら: ['ra'], り: ['ri'], る: ['ru'], れ: ['re'], ろ: ['ro'],
  わ: ['wa'], ゐ: ['wi'], ゑ: ['we'], を: ['wo'],
  が: ['ga'], ぎ: ['gi'], ぐ: ['gu'], げ: ['ge'], ご: ['go'],
  ざ: ['za'], じ: ['zi', 'ji'], ず: ['zu'], ぜ: ['ze'], ぞ: ['zo'],
  だ: ['da'], ぢ: ['di'], づ: ['du'], で: ['de'], ど: ['do'],
  ば: ['ba'], び: ['bi'], ぶ: ['bu'], べ: ['be'], ぼ: ['bo'],
  ぱ: ['pa'], ぴ: ['pi'], ぷ: ['pu'], ぺ: ['pe'], ぽ: ['po'],
  ゔ: ['vu'],
  ぁ: ['xa', 'la'], ぃ: ['xi', 'li', 'xyi', 'lyi'], ぅ: ['xu', 'lu'],
  ぇ: ['xe', 'le', 'xye', 'lye'], ぉ: ['xo', 'lo'],
  ゃ: ['xya', 'lya'], ゅ: ['xyu', 'lyu'], ょ: ['xyo', 'lyo'],
  ゕ: ['xka', 'lka'], ゖ: ['xke', 'lke'], ゎ: ['xwa', 'lwa'],
  っ: ['xtu', 'ltu', 'xtsu', 'ltsu'],
}

/** `ん` is the one kana whose spelling depends on what comes after it. */
const N_SPELLINGS: readonly Spelling[] = [
  plain('nn'),
  plain('xn'),
  plain("n'"),
  { text: 'n', requiresConsonantNext: true },
]

type SmallSet = readonly (readonly [small: string, vowel: string])[]

/** `きゃ` and friends: the small kana stand in for a vowel after a `y`-ish prefix. */
const PALATAL: SmallSet = [['ゃ', 'a'], ['ぃ', 'i'], ['ゅ', 'u'], ['ぇ', 'e'], ['ょ', 'o']]

/** `ふぁ` and friends: the small kana is a plain vowel. */
const SMALL_VOWEL: SmallSet = [['ぁ', 'a'], ['ぃ', 'i'], ['ぅ', 'u'], ['ぇ', 'e'], ['ぉ', 'o']]

interface Family {
  readonly base: string
  readonly smalls: SmallSet
  readonly prefixes: readonly string[]
}

const FAMILIES: readonly Family[] = [
  { base: 'き', smalls: PALATAL, prefixes: ['ky'] },
  { base: 'ぎ', smalls: PALATAL, prefixes: ['gy'] },
  { base: 'し', smalls: PALATAL, prefixes: ['sy', 'sh'] },
  { base: 'じ', smalls: PALATAL, prefixes: ['zy', 'jy', 'j'] },
  { base: 'ち', smalls: PALATAL, prefixes: ['ty', 'cy', 'ch'] },
  { base: 'ぢ', smalls: PALATAL, prefixes: ['dy'] },
  { base: 'に', smalls: PALATAL, prefixes: ['ny'] },
  { base: 'ひ', smalls: PALATAL, prefixes: ['hy'] },
  { base: 'び', smalls: PALATAL, prefixes: ['by'] },
  { base: 'ぴ', smalls: PALATAL, prefixes: ['py'] },
  { base: 'み', smalls: PALATAL, prefixes: ['my'] },
  { base: 'り', smalls: PALATAL, prefixes: ['ry'] },
  { base: 'ふ', smalls: PALATAL, prefixes: ['fy'] },
  { base: 'ゔ', smalls: PALATAL, prefixes: ['vy'] },
  { base: 'く', smalls: PALATAL, prefixes: ['qy'] },
  { base: 'て', smalls: PALATAL, prefixes: ['th'] },
  { base: 'で', smalls: PALATAL, prefixes: ['dh'] },
  { base: 'ふ', smalls: SMALL_VOWEL, prefixes: ['f'] },
  { base: 'ゔ', smalls: SMALL_VOWEL, prefixes: ['v'] },
  { base: 'う', smalls: SMALL_VOWEL, prefixes: ['wh'] },
  { base: 'く', smalls: SMALL_VOWEL, prefixes: ['q', 'kw'] },
  { base: 'ぐ', smalls: SMALL_VOWEL, prefixes: ['gw'] },
  { base: 'つ', smalls: SMALL_VOWEL, prefixes: ['ts'] },
  { base: 'と', smalls: SMALL_VOWEL, prefixes: ['tw'] },
  { base: 'ど', smalls: SMALL_VOWEL, prefixes: ['dw'] },
  { base: 'す', smalls: SMALL_VOWEL, prefixes: ['sw'] },
  { base: 'ず', smalls: SMALL_VOWEL, prefixes: ['zw'] },
]

/** Extra two-kana entries that no family generates. */
const EXTRA_DIGRAPHS: Record<string, readonly string[]> = {
  くゎ: ['kwa'],
  ぐゎ: ['gwa'],
}

function buildTable(): ReadonlyMap<string, readonly Spelling[]> {
  const table = new Map<string, Spelling[]>()
  const add = (kana: string, text: string): void => {
    const existing = table.get(kana)
    if (existing === undefined) {
      table.set(kana, [plain(text)])
    } else if (!existing.some((spelling) => spelling.text === text)) {
      existing.push(plain(text))
    }
  }

  for (const [kana, texts] of Object.entries(MONOGRAPHS)) {
    for (const text of texts) add(kana, text)
  }
  table.set('ん', [...N_SPELLINGS])

  for (const { base, smalls, prefixes } of FAMILIES) {
    const baseTexts = new Set(MONOGRAPHS[base] ?? [])
    for (const [small, vowel] of smalls) {
      for (const prefix of prefixes) {
        const text = prefix + vowel
        // `しぃ` must not accept `shi`, and `ふぅ` must not accept `fu`: those
        // spellings already belong to the base kana on its own.
        if (baseTexts.has(text)) continue
        add(base + small, text)
      }
    }
  }

  for (const [kana, texts] of Object.entries(EXTRA_DIGRAPHS)) {
    for (const text of texts) add(kana, text)
  }

  return table
}

const PUNCTUATION = new Map<string, readonly string[]>([
  ['、', [',']], ['。', ['.']], ['・', ['/']], ['ー', ['-']],
  ['「', ['[']], ['」', [']']], ['　', [' ']],
  ['，', [',']], ['．', ['.']], ['！', ['!']], ['？', ['?']],
  ['（', ['(']], ['）', [')']], ['：', [':']], ['；', [';']],
  ['〜', ['~']], ['～', ['~']], ['『', ['[']], ['』', [']']],
])

export const standardLayout: Layout = {
  name: 'standard',
  table: buildTable(),
  punctuation: PUNCTUATION,
}
