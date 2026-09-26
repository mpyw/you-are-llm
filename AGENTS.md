# Repository instructions

You are LLM is a browser trainer where the user types the model's side of a coding session. [Implementation notes](design/implementation.md) record non-obvious engine, content, keyboard, routing, and build constraints; read the relevant section before changing those areas.

Use pnpm for this workspace. Run `pnpm test`, `pnpm lint`, and `pnpm build` as relevant. Keep Japanese session material and its reading consistent. Do not assume the TypeScript 7 Go binary exposes the classic compiler API required by typescript-eslint; the working dependency arrangement is explained in the notes.
