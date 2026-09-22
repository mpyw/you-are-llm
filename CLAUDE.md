# Notes for future agents

## Do not try to make typescript-eslint see TypeScript 7

`typescript@7` ships a Go binary. Its main entry exports only a version string, so every classic
compiler API is gone. typescript-eslint imports that API, so no amount of version juggling helps.
A JavaScript build of TypeScript (6.0.3 is the last one) has to be reachable as bare `typescript`
from inside typescript-eslint.

These were all tried against pnpm 12.5.1 and all failed:

| Approach | What actually happened |
| --- | --- |
| `pnpm.overrides` in `package.json` | pnpm 12 ignores the `pnpm` field entirely. Settings moved to `pnpm-workspace.yaml`. |
| `overrides: { 'typescript-eslint>typescript': 6.0.3 }` | Rewrites the printed peer range only. The link still points at the root 7.0.2. |
| `packageExtensions` adding `typescript` as a real dependency | Ignored. The existing `peerDependencies` entry wins, and 6.0.3 is never fetched. |
| Root alias `"typescript7": "npm:typescript@^7.0.2"` | pnpm matches peers by real package name, so the alias still satisfies the peer as 7.0.2. |

What works is the workspace split in `tools/eslint-config`. pnpm resolves peers per workspace
package, so that package pins 6.0.3 for itself while the root stays on 7.0.2.

Alternatives if the split ever becomes a burden: oxlint with `oxlint-tsgolint`, which tracks
TypeScript 7 and needs no JavaScript compiler API at all.

## pnpm 12 rejects fresh releases

A supply-chain policy blocks packages published within roughly the last day. `typescript-eslint`
is therefore pinned to an exact version rather than a range. Bumping it needs a version older than
the cutoff, or the install fails with a lockfile policy error.

## Engine invariants worth keeping

The romaji table is generated, not hand written. Two rules keep it honest:

- A two-kana spelling is dropped when it equals a one-kana spelling of its first kana. This is why
  `しぃ` rejects `shi` and `ふぅ` rejects `fu`. Do not special case these by hand.
- `ん` is the only kana whose spelling depends on what follows. The `requiresConsonantNext` flag on
  `Spelling` carries that, and the session filters the next chunk with it.

Do not collapse the cursor set into a single reading. Holding every branch at once is what lets
`si`, `shi` and `ci` all work without asking the typist which one they meant.

## Japanese material carries a reading, not just kanji

The engine turns kana into keys. It cannot turn kanji into keys, because that is the direction an
IME goes, not the direction a romaji table goes. So a Japanese `text` block stores `body` for the
reader and `reading` in kana for the typist.

Rejected alternatives:

| Approach | Why not |
| --- | --- |
| Type the kanji characters directly | Unmapped characters fall through to passthrough. The target becomes untypeable on a real keyboard. |
| Convert kanji to kana at load with a dictionary | Readings are ambiguous, and a wrong reading silently teaches the wrong thing. Material should state it. |

`src/materials/materials.test.ts` fails when a Japanese target still contains Han characters. Keep
that test. It is the only thing standing between a typo in the material and an unwinnable session.

## Component tests need the jsdom docblock

The default vitest environment is node. Files that render React put `// @vitest-environment jsdom`
on the first line. Do not switch the whole suite to jsdom, because the engine tests are pure and
run faster without it.

## Do not put a CNAME in this repository

`mpyw.me` belongs to `mpyw/mpyw.github.io`, the user site. GitHub allows one repository per custom
domain, so claiming it here would take the personal site offline.

Nothing has to be done instead. A user site with a custom domain publishes every project site of
the same account below it, which is why this one lands at `https://mpyw.me/you-are-llm/`. The path
segment is the repository name, so `BASE` in `vite.config.ts` has to match it.

## The site address is written down in three places

A crawler needs an absolute URL, so `index.html` spells out `https://mpyw.me/you-are-llm/` in the
Open Graph tags and points the icon at `/you-are-llm/favicon.svg`. `BASE` in `vite.config.ts` holds
the same path a third time.

Changing where the site lives means changing all three. There is no build time substitution for
them on purpose: a wrong `og:image` fails silently on someone else's server, and a literal string is
the one thing a reader can check by eye.

## A shared link has to answer 200

GitHub Pages has no server, so a deep link used to fall through to `404.html`. The page rendered
fine for a person, but a crawler handed a 404 shows no preview, and the meta tags it did find
described the front page rather than the session.

`static-pages` in `vite.config.ts` writes a real page per session at build time, in both the flat
and the directory form, so whichever one Pages chooses answers 200 with that session's own title
and description. Keep it that way when adding routes worth sharing.

Facebook's `sharer.php` answers 400 to curl no matter what you pass it. That is bot detection, not
a broken URL. Check it in a real browser before changing the endpoint.

## A reading has to agree with its body

The suite proves a target can be typed. That is not the same as proving it says what the screen
says. Two readings shipped that did not: `戻り値` read as `かえりち`, and `セマンティクス` gaining a
`っ`. Both were found by a player, not by us.

`readingProblems` in `scripts/check-material.mjs` compares the two now. Katakana is checked outright
because a katakana word has exactly one transcription. Kanji cannot be, so `GLOSSARY` holds the
terms that have already been wrong once. When a reading slips through, fix it and add the term.

## The yen key types a backslash

A JIS keyboard sends `¥`, U+00A5, from the key where a backslash lives, and macOS does this by
default for several Japanese input sources. The engine rejected it, so any session with `'\0'` in
it could not be finished on a Japanese keyboard.

The fix belongs in the layout, next to the idea that `し` takes `si`, `shi` and `ci`. Do not special
case it in the keyboard handler.

## Symbol count is not difficulty

The first grader counted keystrokes and charged double for Shift. By that measure PHP is the
heaviest language in the set, ahead of Rust, which nobody who has typed both believes.

The measure was not wrong, it was incomplete. PHP really does type more symbols per character: a
`$` on every variable and an `->` on every call. But those are two shapes, learned once. Rust
spends a similar weight across `&mut`, `::`, `<'a>`, `?`, `|x|` and more.

`typing-load.mjs` multiplies volume by variety now, where variety is the effective number of
distinct symbol shapes, two to the power of the entropy of their distribution. That last part is
what makes `$` cheap however often it appears, and it is the part to keep if the model is ever
rewritten. Tokens shared by most languages are excluded, because a bracket is muscle memory.

Measured per session: Rust 18.1 shapes, PHP 13.3, Java 7.6.

## Tab is the page's key first

Tab moves focus. Swallowing it outright would trap anyone working the page from the keyboard, so it
is only taken when the session is actually waiting on an indent, which the engine already knows
from `nextKeys`. Anywhere else it is left alone, and it is never counted as a mistake.

The indent itself is an alternative spelling, the same machinery that lets `し` take `si`, `shi` and
`ci`. A run of spaces at the start of a line is one chunk that accepts either the spaces or a tab.
Do not add a special case to the keyboard handler for it.
