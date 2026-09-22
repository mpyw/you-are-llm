import { copyFileSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

/** GitHub Pages serves this repository under its own name. */
const BASE = '/you-are-llm/'
const SITE = `https://mpyw.me${BASE}`
const MATERIAL = 'src/materials/sessions'

interface SessionMeta {
  readonly id: string
  readonly title: string
  readonly summary: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function text(value: unknown, where: string): string {
  if (typeof value !== 'string') throw new Error(`${where} must be a string`)
  return value
}

function readSessions(): readonly SessionMeta[] {
  return readdirSync(MATERIAL)
    .filter((name) => name.endsWith('.json'))
    .map((name) => {
      const raw: unknown = JSON.parse(readFileSync(resolve(MATERIAL, name), 'utf8'))
      if (!isRecord(raw)) throw new Error(`${name} is not an object`)
      return {
        id: text(raw.id, `${name}.id`),
        title: text(raw.title, `${name}.title`),
        summary: text(raw.summary, `${name}.summary`),
      }
    })
}

function escapeAttribute(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

/** Swaps the shell's own title and description for one session's. */
function pageFor(shell: string, session: SessionMeta): string {
  const title = escapeAttribute(`${session.title} · You are LLM`)
  const description = escapeAttribute(session.summary)
  const url = escapeAttribute(`${SITE}sessions/${session.id}`)
  return shell
    .replace('<title>You are LLM</title>', `<title>${title}</title>`)
    .replaceAll(/(<meta (?:property|name)="(?:og|twitter):title" content=)"[^"]*"/g, `$1"${title}"`)
    .replaceAll(
      /(<meta\s+(?:property|name)="(?:og|twitter):description"\s+content=\n?\s*)"[^"]*"/g,
      `$1"${description}"`,
    )
    .replaceAll(/(<meta property="og:url" content=)"[^"]*"/g, `$1"${url}"`)
}

/**
 * GitHub Pages has no server to render on, so every session gets a real page
 * written at build time. Two of them: one that answers `/sessions/<id>` without
 * a redirect and one for the directory form. A crawler that is handed a 404
 * shows no preview at all, which is what the shared link used to get.
 */
function staticPages(): Plugin {
  let outDir = 'dist'
  return {
    name: 'static-pages',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir
    },
    closeBundle() {
      const shell = readFileSync(resolve(outDir, 'index.html'), 'utf8')
      // Anything else deep linked still lands on the shell through 404.html.
      copyFileSync(resolve(outDir, 'index.html'), resolve(outDir, '404.html'))

      for (const session of readSessions()) {
        const page = pageFor(shell, session)
        const flat = resolve(outDir, 'sessions', `${session.id}.html`)
        const nested = resolve(outDir, 'sessions', session.id, 'index.html')
        mkdirSync(resolve(outDir, 'sessions', session.id), { recursive: true })
        writeFileSync(flat, page)
        writeFileSync(nested, page)
      }
    },
  }
}

export default defineConfig({
  base: BASE,
  plugins: [tanstackRouter({ target: 'react', autoCodeSplitting: true }), react(), staticPages()],
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
