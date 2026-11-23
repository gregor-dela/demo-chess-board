import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'scripts/**/*.test.mjs'],
    css: true,
    setupFiles: ['src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
      // Meri le izvorno kodo aplikacije; konfiguracijske skripte in tipe izključi.
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/main.tsx',
        'src/App.tsx',
        'src/types/**',
        'src/test/**',
        'src/**/__tests__/**',
        'src/**/*.test.{ts,tsx}'
      ],
      // Pragovi na ravni DoD v1.0 (statements/lines/functions ≥95, branches ≥90).
      // Dvig iz vmesne stopnje 90/85/90/90 na ciljne vrednosti.
      thresholds: {
        statements: 95,
        lines: 95,
        functions: 95,
        branches: 90
      }
    }
  }
})

