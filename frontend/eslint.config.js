import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // 这些文件使用 effect 从 props/外部状态初始化 React 状态，是合法模式
    files: [
      'src/components/knowledge/RuleEditDialog.tsx',
      'src/hooks/useOfflineQueue.ts',
      'src/hooks/usePushNotifications.ts',
    ],
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    // React Compiler 对第三方库（如 React Hook Form）的兼容性提示，
    // 属于信息性警告而非代码质量问题，在 CI 中不阻塞构建
    files: ['**/*.{ts,tsx}'],
    rules: {
      'react-hooks/incompatible-library': 'off',
    },
  },
])
