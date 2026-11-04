import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    css: true,
    setupFiles: ['src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'src/main.tsx',
        'src/App.tsx',
        'tailwind.config.js',
        'postcss.config.js',
        'debug-*.ts'
      ],
      // Postopno dvigovanje pragov proti DoD v1.0 (statements/lines/functions ≥95, branches ≥90).
      // Trenutna stopnja (vmesna): 90 / 85 / 90 / 90; dvignjeno iz 80/70/80/80.
      thresholds: {
        statements: 90,
        lines: 90,
        functions: 90,
        branches: 85
      }
    }
  }
})

