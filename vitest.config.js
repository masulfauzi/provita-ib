import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config.js'

export default defineConfig((env) =>
  mergeConfig(
    viteConfig(env),
    defineConfig({
      test: {
        environment: 'jsdom',
        setupFiles: ['./vitest.setup.js'],
        exclude: [...configDefaults.exclude, 'e2e/**', 'template/**'],
        root: fileURLToPath(new URL('./', import.meta.url)),
      },
    }),
  ),
)
