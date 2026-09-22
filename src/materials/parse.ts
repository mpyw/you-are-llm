import type { Block, BlockKind, Language, Session, SourceFile, Turn } from './types'

/**
 * Material is hand written JSON today and will be generated from real
 * transcripts later. Both paths can produce a wrong shape, so every field is
 * checked on load and the error names the exact position.
 */
export class MaterialError extends Error {
  constructor(path: string, expected: string) {
    super(`material: ${path} must be ${expected}`)
    this.name = 'MaterialError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asRecord(value: unknown, path: string): Record<string, unknown> {
  if (!isRecord(value)) throw new MaterialError(path, 'an object')
  return value
}

function asString(value: unknown, path: string): string {
  if (typeof value !== 'string') throw new MaterialError(path, 'a string')
  return value
}

function asOptionalString(value: unknown, path: string): string | null {
  if (value === undefined || value === null) return null
  return asString(value, path)
}

function asArray(value: unknown, path: string): readonly unknown[] {
  if (!Array.isArray(value)) throw new MaterialError(path, 'an array')
  return value
}

const BLOCK_KINDS = new Set<string>(['text', 'code', 'command'])
const LANGUAGES = new Set<string>(['ja', 'en'])

function isBlockKind(value: string): value is BlockKind {
  return BLOCK_KINDS.has(value)
}

function isLanguage(value: string): value is Language {
  return LANGUAGES.has(value)
}

function parseBlock(value: unknown, path: string): Block {
  const raw = asRecord(value, path)
  const kind = asString(raw.kind, `${path}.kind`)
  if (!isBlockKind(kind)) throw new MaterialError(`${path}.kind`, [...BLOCK_KINDS].join(' or '))
  return {
    kind,
    body: asString(raw.body, `${path}.body`),
    reading: asOptionalString(raw.reading, `${path}.reading`),
    lang: asOptionalString(raw.lang, `${path}.lang`),
  }
}

function parseTurn(value: unknown, path: string): Turn {
  const raw = asRecord(value, path)
  return {
    user: asString(raw.user, `${path}.user`),
    assistant: asArray(raw.assistant, `${path}.assistant`).map((block, index) =>
      parseBlock(block, `${path}.assistant[${String(index)}]`),
    ),
  }
}

function parseFile(value: unknown, path: string): SourceFile {
  const raw = asRecord(value, path)
  return {
    path: asString(raw.path, `${path}.path`),
    content: asString(raw.content, `${path}.content`),
  }
}

export function parseSession(value: unknown): Session {
  const raw = asRecord(value, 'session')
  const id = asString(raw.id, 'session.id')
  const language = asString(raw.language, `${id}.language`)
  if (!isLanguage(language)) throw new MaterialError(`${id}.language`, [...LANGUAGES].join(' or '))
  return {
    id,
    title: asString(raw.title, `${id}.title`),
    language,
    summary: asString(raw.summary, `${id}.summary`),
    files: asArray(raw.files, `${id}.files`).map((file, index) =>
      parseFile(file, `${id}.files[${String(index)}]`),
    ),
    turns: asArray(raw.turns, `${id}.turns`).map((turn, index) =>
      parseTurn(turn, `${id}.turns[${String(index)}]`),
    ),
  }
}
