import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // 'SmartMahalla' is a nested Django backend project (with its own dist/
  // static/staticfiles build output and a .venv) that lives inside this
  // frontend directory - it isn't part of this app and its huge bundled
  // JS crashes ESLint's formatter if scanned.
  globalIgnores(['dist', 'SmartMahalla']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
])
