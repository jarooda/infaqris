// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'
import eslintConfigPrettier from 'eslint-config-prettier'
import typescriptParser from '@typescript-eslint/parser'

export default withNuxt(
  eslintConfigPrettier,
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: typescriptParser,
      },
    },
  },
  {
    // New vendored .ts files (e.g. anchored-popup, added via `npx @jarooda/jlds add`)
    // aren't picked up by Nuxt's generated type-aware glob until the project is built,
    // so they fall back to the plain JS parser and fail on TS-only syntax.
    files: ['app/components/ui/**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
    },
  },
  {
    rules: {
      'vue/html-self-closing': 'off',
      'vue/multi-word-component-names': 'off',
    },
  },
  {
    // Vendored JLDS design-system source (added via `npx @jarooda/jlds add`).
    // These files are maintained upstream; the unused-vars rule misfires on their
    // type-position parameter names (e.g. Resizable's context interface).
    files: ['app/components/ui/**'],
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
)
