/** @type {import('prettier').Config} */
const config = {
  plugins: ['prettier-plugin-tailwindcss'],

  // 기본 옵션
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: false,
  singleQuote: true,
  trailingComma: 'es5',
  bracketSpacing: true,
  bracketSameLine: false,

  // JSX
  singleAttributePerLine: true,

  // Tailwind
  tailwindFunctions: ['cn', 'cva'],
}

export default config
