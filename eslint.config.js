import js from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  // src/shared/types는 Supabase에서 자동 생성한다 (수기 편집 금지)
  { ignores: ['dist', 'src/shared/types'] },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommendedTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.app.json', './tsconfig.node.json', './tsconfig.test.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      // React
      ...reactHooks.configs.recommended.rules,
      // React Compiler 미사용 — 외부 라이브러리의 불필요한 호환성 경고 제거
      'react-hooks/incompatible-library': 'off',
      // HMR을 위해 컴포넌트만 export 권장 (상수 export는 허용)
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // Import
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      // TypeScript
      // _로 시작하는 인자는 unused 검사 제외 (예: function handler(_event) {})
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // import type { Foo } 강제 — 타입은 런타임에 제거되므로 번들 최적화에 유리
      '@typescript-eslint/consistent-type-imports': 'error',
      // interface 대신 type 사용 강제 — union, intersection 등 더 유연하게 활용 가능
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      // React 이벤트 핸들러 등 JSX attribute에는 async 함수를 직접 전달할 수 있도록 허용
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: false } },
      ],

      // TypeScript (비활성화)
      // 유니온 타입에서 any처럼 동작하는 구성원 경고 — false positive 발생
      '@typescript-eslint/no-redundant-type-constituents': 'off',
      // 외부 라이브러리 내부 any로 인해 통합 지점에서 과도하게 발생
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      // ||(falsy)와 ??(nullish)는 의미가 다름 — 강제 변환 시 0, "" 등에서 버그 유발 가능
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
    },
  },
  // shadcn ui 컴포넌트 예외
  {
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
    },
  },
  // 포매팅 규칙은 Prettier에 위임 — ESLint와의 충돌 방지
  eslintConfigPrettier
)
