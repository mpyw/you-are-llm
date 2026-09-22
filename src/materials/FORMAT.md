# Writing session material

A session is one coding conversation. The learner types the assistant side of it, key by key,
with no completion. Everything here exists to keep that typable and worth typing.

## Where a file goes

One session is one file at `src/materials/sessions/<id>.json`. The file name matches the `id`
inside it. Nothing registers the file. The loader picks up the whole directory.

Use `<topic>-<codeLanguage>-<difficulty>-<language>` for the id, all lower case.
An example is `lifetime-borrow-rust-hard-ja`.

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

Each turn holds a `user` string and an `assistant` array of blocks.

| Block field | Meaning |
| --- | --- |
| `kind` | `text`, `code` or `command` |
| `body` | What the reader sees |
| `reading` | What the typist types. See below |
| `lang` | Highlight tag on `code` blocks, such as `rust`. Omit elsewhere |

The `user` string is context. Nobody types it, so it can be as messy as a real person is.

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

| `body` | `reading` |
| --- | --- |
| `借用チェッカに怒られています。` | `しゃくようちぇっかにおこられています。` |
| `Vec を 2 回借りています。` | `Vec を 2 かいかりています。` |
| `then を 3 つ繋げます。` | `then を 3 つつなげます。` |

## Difficulty budget

Count a block's length by its typed target, which is the `reading` when there is one.

| Difficulty | Turns | Blocks in total | Typical block |
| --- | --- | --- | --- |
| `easy` | 2 | 3 to 4 | 40 to 90 characters |
| `normal` | 3 | 5 to 7 | 90 to 170 characters |
| `hard` | 4 to 5 | 8 to 11 | 130 to 260 characters |

`normal` and `hard` must each contain at least one `command` block that edits the source with
`sed`. That is the point of the trainer. Escaping `*` and `/` inside a `sed` pattern is exactly
the kind of typing the learner came for.

## Voice

Real sessions are not tidy. Write them the way they actually go.

| Do | Do not |
| --- | --- |
| Let the user change their mind halfway | Have the user state perfect requirements once |
| Let the user be terse, blunt or vague | Write polite full paragraphs for every prompt |
| Have the assistant admit a mistake and fix it | Have the assistant be right every time |
| Keep the code small and real | Invent a whole framework |

The assistant voice stays plain and useful. It is being typed, so no decorative filler.

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
