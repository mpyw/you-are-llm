# Writing session material

A session is one coding conversation. The learner types the assistant side of it, key by key,
with no completion. Everything here exists to keep that typable and worth typing.

## Where a file goes

One session is one file at `src/materials/sessions/<id>.json`. The file name matches the `id`
inside it. Nothing registers the file. The loader picks up the whole directory.

Use `<topic>-<codeLanguage>-<language>` for the id, all lower case. An example is
`lifetime-borrow-rust-ja`.

> [!IMPORTANT]
> The difficulty is not in the id. It is measured rather than chosen, so it changes, and an id has
> to survive that because it is the URL people share.

## Fields

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | string | Matches the file name |
| `title` | string | Shown in the list. Write it in the session's own language |
| `language` | `ja` or `en` | The language of the conversation |
| `difficulty` | `easy`, `normal` or `hard` | See the budget below |
| `codeLanguage` | see below | The language of the code under discussion |
| `summary` | string | One line for the list |
| `files` | array | Source the assistant is working on. `path` and `content` |
| `turns` | array | The conversation, in order |

`codeLanguage` is one of `c`, `cpp`, `csharp`, `go`, `java`, `php`, `rust`, `typescript`.
`difficulty` is one of `easy`, `normal`, `hard`, `expert`, `expertplus`, and `scripts/typing-load.mjs` decides
it. Write whatever session you meant to write and let the script grade it.

Each turn holds a `user` string and an `assistant` array of blocks.

| Block field | Meaning |
| --- | --- |
| `kind` | `text`, `code` or `command` |
| `body` | What the reader sees |
| `reading` | What the typist types. See below |
| `lang` | Highlight tag on `code` blocks, such as `rust`. Omit elsewhere |

The `user` string is context. Nobody types it, so it can be as messy as a real person is.

> [!IMPORTANT]
> Indent code with spaces. A literal tab cannot be typed and the checker rejects one. The trainer
> lets the typist press Tab for a step of indent, which it measures from the spaces you wrote.

## The reading rule

The engine turns kana into keys. It cannot turn kanji into keys, because that is the direction an
IME runs, not the direction a romaji table runs.

| Block | `reading` |
| --- | --- |
| Japanese `text` | Required. The same sentence in kana |
| Japanese `code` or `command` | Omit it. The body is typed as it stands |
| Any English block | Omit it |

> [!CAUTION]
> A `reading` may hold kana, ASCII, and this punctuation only:
>
> ```
> 、。「」『』（）！？：；・ー〜～，．　
> ```
>
> One kanji left in a reading makes the session impossible to finish. The test suite fails on it.

Katakana is fine in a reading, because katakana types the same as hiragana. Numbers and Latin
words stay as ASCII. Keep the reading faithful to the body, including particles.

> [!WARNING]
> The checker compares the reading to the body. A katakana word has one transcription and is checked
> directly. Kanji needs a dictionary, so `GLOSSARY` in `scripts/check-material.mjs` holds the terms
> that have been got wrong before. Add to it whenever one gets through.

| `body` | `reading` |
| --- | --- |
| `借用チェッカに怒られています。` | `しゃくようちぇっかにおこられています。` |
| `Vec を 2 回借りています。` | `Vec を 2 かいかりています。` |
| `then を 3 つ繋げます。` | `then を 3 つつなげます。` |

## How long a session runs

Difficulty no longer says anything about length. It measures how hard the session is to type,
across every language rather than within one, which is why Rust has no easy session at all.

| Difficulty | Score | Sessions today |
| --- | --- | --- |
| `easy` | under 11 | 24 |
| `normal` | 11 to 16 | 22 |
| `hard` | 16 to 22 | 30 |
| `expert` | 22 to 34 | 18 |
| `expertplus` | over 34 | 2 |

The score is hardness per keystroke, stretched a little by length. Hardness is the share of keys
needing Shift times the number of distinct symbol shapes. Length counts symbol keystrokes only,
because a long identifier is the easiest thing on the keyboard.

```bash
node scripts/typing-load.mjs            # what every session scores
node scripts/typing-load.mjs --apply    # write the grades back
```

What you control is the shape. Aim for two to five turns and three to fourteen blocks in total.
A third turn means the requirements changed, and a change of requirements is applied with `sed`.
The suite holds you to both.

## Voice

Real sessions are not tidy. Write them the way they actually go.

| Do | Do not |
| --- | --- |
| Let the user change their mind halfway | Have the user state perfect requirements once |
| Let the user be terse, blunt or vague | Write polite full paragraphs for every prompt |
| Have the assistant admit a mistake and fix it | Have the assistant be right every time |
| Keep the code small and real | Invent a whole framework |

The assistant voice stays plain and useful. It is being typed, so no decorative filler.

### The assistant sounds like an LLM

That is the joke the trainer is built on. The assistant is an LLM, so it talks like one, and a
Japanese reader should catch it and smile. Four habits carry it.

| Habit | Examples |
| --- | --- |
| A translation that stopped halfway | `Now、`, `Let's`, `Here's`, `Note:`, `TL;DR` |
| Praise nobody asked for | `鋭いご指摘です`, `素晴らしい質問です`, `承知しました` |
| A word that only arrives through a dictionary | `正本`, `堅牢`, `優雅に`, `べき等`, `関心の分離` |
| Sentence furniture | `〜という点に注意することが重要です`, `〜を保証します`, `言い換えると` |

The fifth habit is the one people quote back. The assistant says it did something, then comes back
and admits it did not. Or it explains a thing with total confidence and corrects itself a turn
later.

| Phrase | Where it lands |
| --- | --- |
| `申し訳ありません。先ほどの実装は反映されていませんでした。` | It claimed to have done the work |
| `改めて確認したところ、正確ではありませんでした。` | It stated something wrong and checked afterwards |
| `前言を撤回します。` | It argued for a design and now drops it |
| `重要な訂正があります。` | Delivered with the calm of someone who broke the build |

Every session above `easy` already has the assistant slip once. That slip has to be owned in this
voice, and the checker enforces it.

`scripts/check-material.mjs` holds both lists, `AI_TELLS` and `SELF_CORRECTIONS`. How many distinct
tells a Japanese session needs depends on how much prose it has to wear them on.

| Prose blocks | Distinct tells | Self correction |
| --- | --- | --- |
| 2 or fewer | 3 | not required |
| 3 | 4 | required |
| 4 or more | 5 | required |

Those are floors. Lay it on thick. Two blocks cannot carry five tells without turning into parody,
which is why the floor follows the prose rather than the difficulty.

> [!WARNING]
> Thick is not uniform. Every block opening with `素晴らしい質問です！` stops being funny by the
> second one, and the learner still types all of it. Vary the habit across blocks, and leave a
> block plain now and then so the next one lands.

The technical content stays correct. The assistant is odd in its wording, never in its advice.
English sessions may carry lighter versions of the same habit, such as `Great question!`,
`single source of truth`, or `Apologies, my previous answer was incorrect.` They are not checked.

## Checking your work

```bash
node scripts/check-material.mjs src/materials/sessions/<id>.json
```

That catches the mechanical faults, above all an untypable reading. The full suite, `pnpm test`,
also runs every target through the engine.

## A complete example

```json
{
  "id": "retry-typescript-easy-ja",
  "title": "fetchUser にリトライを足す",
  "language": "ja",
  "difficulty": "easy",
  "codeLanguage": "typescript",
  "summary": "既存の関数に指数バックオフを一つ足す。",
  "files": [
    {
      "path": "src/api/user.ts",
      "content": "export async function fetchUser(id: string) {\n  return request(id)\n}\n"
    }
  ],
  "turns": [
    {
      "user": "fetchUser、たまにコケるんだけどリトライ入れられる？",
      "assistant": [
        {
          "kind": "text",
          "body": "入れます。失敗するたびに待ち時間を倍にして、3 回まで再試行します。",
          "reading": "いれます。しっぱいするたびにまちじかんをばいにして、3 かいまでさいしこうします。"
        },
        {
          "kind": "code",
          "lang": "typescript",
          "body": "for (let attempt = 0; ; attempt += 1) {\n  try {\n    return await request(id)\n  } catch (error) {\n    if (attempt >= 3) throw error\n    await sleep(2 ** attempt * 100)\n  }\n}\n"
        }
      ]
    },
    {
      "user": "ごめん 3 回じゃ足りなかった。5 回にして",
      "assistant": [
        { "kind": "text", "body": "回数だけ変えます。", "reading": "かいすうだけかえます。" },
        {
          "kind": "command",
          "body": "sed -i '' 's/attempt >= 3/attempt >= 5/' src/api/user.ts"
        }
      ]
    }
  ]
}
```
