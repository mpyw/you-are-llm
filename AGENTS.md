# Repository instructions

You are LLM is a browser trainer where the user types the model's side of a coding session. [Implementation notes](design/implementation.md) record non-obvious engine, content, keyboard, routing, and build constraints; read the relevant section before changing those areas.

Use pnpm for this workspace. Run `pnpm test`, `pnpm lint`, and `pnpm build` as relevant. Keep Japanese session material and its reading consistent. Lint with oxlint, not ESLint: TypeScript 7 has no JavaScript compiler API, so typescript-eslint cannot run here.
