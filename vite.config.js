import { fileURLToPath, URL } from 'node:url'
import process from 'node:process'
import { rm } from 'node:fs/promises'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import vueDevTools from 'vite-plugin-vue-devtools'

/** Buang Mock Service Worker dari hasil build bila mock tidak dipakai. */
function tanpaMockWorker(pakaiMock) {
  return {
    name: 'provita:tanpa-mock-worker',
    apply: 'build',
    async closeBundle() {
      if (!pakaiMock) await rm(new URL('./dist/mockServiceWorker.js', import.meta.url), { force: true })
    },
  }
}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  return {
    plugins: [
      vue(),
      tailwindcss(),
      command === 'serve' && vueDevTools(),
      tanpaMockWorker(env.VITE_USE_MOCK === 'true'),
    ].filter(Boolean),
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      chunkSizeWarningLimit: 900,
      rolldownOptions: {
        output: {
          // Build produksi tidak membawa console.* / debugger (issue #8).
          minify: { compress: { dropConsole: true, dropDebugger: true } },
        },
      },
    },
  }
})
