# You are LLM

A typing trainer where you type the LLM's side of a coding session. No completion. No shortcuts.

## Status

The prototype runs end to end. One Japanese session ships with material, plus its English
translation. AZIK is not implemented yet.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm build` | Typecheck, then build into `dist/` |
| `pnpm test` | Run the tests |
| `pnpm lint` | Lint with type-aware rules |
| `pnpm typecheck` | Typecheck only |

## How a session runs

Pick a session, then type the assistant blocks one at a time. Every block is one run of the engine.
A block ends only when the whole target is typed.

| You see | You type |
| --- | --- |
| The user prompt | Nothing. It is context |
| Japanese prose | Its kana reading, which an IME turns into the kanji |
| Code and shell commands | The characters as they stand |

Enter produces a newline. A key the engine rejects counts as a mistake and changes nothing else.

## The input engine

`TypingSession` keeps every possible spelling alive at once. The typist never declares a reading.
The engine narrows the options as keys arrive.

| Target | Keys it accepts |
| --- | --- |
| `し` | `si`, `shi`, `ci` |
| `きゃ` | `kya`, `kixya`, `kilya` |
| `じゃ` | `zya`, `ja`, `jya`, `zixya` |
| `きって` | `kitte`, `kixtute`, `kiltute` |
| `にほん` | `nihonn`, `nihoxn`, `nihon'` |

Three rules do most of the work.

| Rule | Holds | Fails |
| --- | --- | --- |
| A bare `n` needs a consonant next | `kanzi` for `かんじ` | `kiniro` for `きんいろ` |
| `っ` doubles any consonant but `n` | `kitte` for `きって` | `anna` for `あっな` |
| A digraph never takes a single kana's spelling | `syi` for `しぃ` | `shi` for `しぃ` |

Characters outside the table are typed as themselves. That is what makes source code work as material.

> [!NOTE]
> Alternative layouts such as AZIK plug in through the `Layout` interface in `src/engine/types.ts`.
> The engine holds no table of its own.

## Material

Sessions are static JSON under `src/materials/`. They are validated on load, so a bad field fails
fast and names its own position.

| Field | Meaning |
| --- | --- |
| `files` | Existing source shown beside the transcript |
| `turns[].user` | The prompt. Displayed, never typed |
| `turns[].assistant[].kind` | `text`, `code` or `command` |
| `turns[].assistant[].body` | What the reader sees |
| `turns[].assistant[].reading` | What the typist types. Null means `body` is typed directly |

> [!IMPORTANT]
> A Japanese `text` block needs a `reading` in kana. A test fails the build when kanji reach a
> Japanese typing target, because no romaji sequence can produce them.

## TypeScript 7 and ESLint

The app runs on TypeScript 7. typescript-eslint cannot.

| Package | Version here | Why |
| --- | --- | --- |
| `typescript` (root) | 7.0.2 | Compiles and typechecks the app |
| `typescript` (in `tools/eslint-config`) | 6.0.3 | The last release with the JavaScript compiler API |
| `typescript-eslint` | 8.70.0 | Pinned below the 8.70.1 supply-chain cutoff |

TypeScript 7 exports only `./lib/version.cjs` from its main entry. The old `ts.createProgram` API is
gone. typescript-eslint imports that API directly, so it needs a JavaScript build of TypeScript.

pnpm resolves a peer dependency per workspace package. So `tools/eslint-config` pins TypeScript 6.0.3
for itself, and the app keeps TypeScript 7. Both live in one repository.

> [!IMPORTANT]
> Never add `typescript-eslint` to the root `package.json`. It would resolve the root TypeScript 7 and
> break. Lint plugins belong in `tools/eslint-config`.

Run `pnpm lint` to confirm the split still works. Type-aware rules such as `no-floating-promises`
only fire when typescript-eslint has a working compiler.
