import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

/**
 * Shared flat config.
 *
 * This package pins `typescript@6.0.3` on purpose. typescript-eslint needs the
 * JavaScript compiler API, which `typescript@7` no longer ships. Keeping the
 * pin inside this workspace package lets the app itself stay on TypeScript 7.
 *
 * @param {object} options
 * @param {string} options.tsconfigRootDir Directory that holds the app tsconfig.
 * @returns {import('eslint').Linter.Config[]}
 */
export function defineConfig({ tsconfigRootDir }) {
  return tseslint.config(
    { ignores: ['dist', 'node_modules', '**/routeTree.gen.ts'] },
    js.configs.recommended,
    tseslint.configs.strictTypeChecked,
    tseslint.configs.stylisticTypeChecked,
    {
      files: ['**/*.{ts,tsx}'],
      languageOptions: {
        globals: globals.browser,
        parserOptions: { projectService: true, tsconfigRootDir },
      },
      plugins: {
        'react-hooks': reactHooks,
        'react-refresh': reactRefresh,
      },
      rules: {
        ...reactHooks.configs.recommended.rules,
        'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      },
    },
    {
      // Route files export a `Route` object rather than a component, so the
      // fast refresh rule never fits them. TanStack Router's Vite plugin
      // handles hot reloading for this directory itself.
      files: ['**/routes/**/*.tsx'],
      rules: {
        'react-refresh/only-export-components': 'off',
      },
    },
    {
      files: ['**/*.js'],
      extends: [tseslint.configs.disableTypeChecked],
    },
  )
}

export default defineConfig
