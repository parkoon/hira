import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { visualizer } from 'rollup-plugin-visualizer'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: '127.0.0.1',
    port: 5000,
  },
  plugins: [
    react(),
    tailwindcss(),
    process.env.ANALYZE === 'true' &&
      visualizer({
        filename: 'dist/stats.html',
        gzipSize: true,
        brotliSize: true,
        open: false,
      }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // ag-grid vendor 청크(약 630KB)는 단일 라이브러리라 더 쪼갤 수 없다. 그 크기를 수용한다.
    chunkSizeWarningLimit: 700,
    rolldownOptions: {
      output: {
        // ag-grid는 덩치가 커(gzip 약 180KB) 그리드를 쓰는 페이지 청크를 비대하게 만든다.
        // 별도 vendor 청크로 분리해 그리드를 쓰는 여러 페이지가 공유·캐싱하게 한다.
        codeSplitting: {
          groups: [{ name: 'ag-grid', test: /[\\/]node_modules[\\/](ag-grid-|ag-stack)/ }],
        },
      },
    },
  },
})
