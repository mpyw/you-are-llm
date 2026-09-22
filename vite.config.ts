import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

/** GitHub Pages serves this repository under its own name. */
const BASE = '/you-are-llm/'

/**
 * GitHub Pages has no rewrite rule, so a deep link lands on 404. Serving the
 * same shell from 404.html lets the router take over from there.
 */
function spaFallback(): Plugin {
  let outDir = 'dist'
  return {
    name: 'spa-fallback',
    apply: 'build',
    configResolved(config) {
      outDir = config.build.outDir
    },
    closeBundle() {
      copyFileSync(resolve(outDir, 'index.html'), resolve(outDir, '404.html'))
    },
  }
}

export default defineConfig({
  base: BASE,
  plugins: [tanstackRouter({ target: 'react', autoCodeSplitting: true }), react(), spaFallback()],
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
