---
name: add-sessions
description: Add typing sessions to this trainer. How to pick topics that do not collide. How to hand the writing to one subagent per programming language, and the prompt that gets usable material back. The mistakes those agents make. The numbers to update afterwards. Read it for "セッションを増やして", "題材を追加", "add more material", or any request to grow src/materials/sessions.
---

# Adding sessions

One session is one file under `src/materials/sessions/`. A batch is normally one subagent per
programming language, writing six files each: three Japanese, and the same three scenarios in
English. That is 48 files for a full round.

`src/materials/FORMAT.md` is the authoring contract. Everything below is about running the batch.

## Start by looking at what is there

```bash
pnpm material:report
```

It prints the count, the grid of language by difficulty, the topics already taken, whether Japanese
and English are in step, and the places where the total is written down by hand.

Give every agent the topics already taken for its language. That is the only thing standing between
you and two sessions about the same bug.

## One agent per language

Do not hand one agent the whole batch. Eight agents working on disjoint files finish in about five
minutes and none of them has to hold eight languages in mind at once.

| Give each agent | Why |
| --- | --- |
| Its language, and only its files | They share a directory, so scope has to be explicit |
| The topics already taken | Otherwise you get a second `equals-hashcode` |
| Two or three topic suggestions | They pick better with a starting point, and the set stays varied |
| The checker command | They fix their own mistakes before reporting |

> [!WARNING]
> Tell them not to run `pnpm test`. Eight agents running the whole suite over a directory the other
> seven are still writing to produces failures that belong to nobody.

## The prompt that works

Written to a colleague, not to a machine. Keep it in Japanese, because the material is.

```text
お疲れさまです。`you-are-llm` の教材を増やす第 N 弾です。<言語> 担当をお願いできますか。

新規 6 本（日本語 easy / normal / hard ＋ 同じ題材の英語版 3 本）を
`src/materials/sessions/` に追加してください。既存ファイルには一切触らないでください。

まず `src/materials/FORMAT.md` を読んでください。アシスタントは AI 特有の喋り方をする必要が
あり，地の文の量に応じた言い回しの種類数（2 ブロック以下 3 / 3 ブロック 4 / 4 ブロック以上 5）
と，3 ブロック以上での自己訂正フレーズがチェッカで必須になっています。語彙は
`scripts/check-material.mjs` の `AI_TELLS` と `SELF_CORRECTIONS` にあります。

難易度は書き手が決めません。`scripts/typing-load.mjs` が打鍵数から採点するので，
`difficulty` には仮の値を入れておけば後でまとめて直ります。

既存の <言語> 題材は <既存トピック> なので，別の題材でお願いします。候補: <2〜3 個>

- ファイル名と `id` は `<topic>-<codeLanguage>-<language>`。難易度は含めない
- normal と hard には `sed` でソースを書き換えるターンを必ず入れる
- 日本語の `text` ブロックには漢字ゼロの `reading` を必ず付ける。`code` と `command` は
  `reading` なしで，中身は ASCII のみ
- ユーザー発言は表示専用なので人間らしく雑に。後出しの条件追加，心変わり，言葉足らず
- アシスタントは normal 以上で一度ミスして指摘され，自己訂正フレーズで認める

書けたら `node scripts/check-material.mjs <新規ファイル>` を全部 ok にしてください。
`pnpm test` は他の担当と競合するので実行しないでください。

最後に，作ったファイル名と題材を一行ずつ報告してください。
```

A named request beats a list of constraints. `if err != nil` の波動拳 and the DB transaction that
takes a closure both came from one line each, and both landed better than anything generated from
a category.

## What the agents get wrong

| Mistake | What it costs |
| --- | --- |
| Japanese comments inside a `code` block | The block is typed as it stands, so the session becomes impossible |
| An em dash in English prose | Same. The checker now catches it, but only because one got through |
| A reading that drifts from its body | Nothing fails. Only reading it catches this |
| Praise on every block | Stops being funny at the second one, and it all has to be typed |
| Writing outside their six files | Rare, but check the diff before believing the report |

> [!IMPORTANT]
> The suite proves a session can be typed and holds no impossible character. It cannot prove a
> reading is the right reading. Read a few Japanese sessions yourself before pushing.

## After the batch

```bash
node scripts/check-material.mjs src/materials/sessions/*.json
pnpm test
pnpm lint
pnpm build
```

Then grade the new sessions, which is measured rather than chosen.

```bash
node scripts/typing-load.mjs --apply
```

Then update the total, which lives in four places by hand. `pnpm material:report` prints them.

| Place | What to change |
| --- | --- |
| `scripts/og.html` | The count in the footer strip |
| `index.html` | `og:description` and `twitter:description` |
| `README.md` | The Status section |
| The GitHub description | `gh repo edit --description "..."`, which is outside the repository |

Render both preview images again, per `docs/social-preview.md`. Then commit, push, and confirm the
deploy finished before saying it is live.

## Reviewing the result

Read one hard Japanese session end to end. It is the fastest way to tell whether a batch is good:
the retraction has to land in the right place, the `sed` has to be worth typing, and the prompt has
to sound like someone who has changed their mind twice already.
