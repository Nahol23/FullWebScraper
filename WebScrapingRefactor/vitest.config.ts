import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/__tests__/**',
        'node_modules/**',
      ],
      
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
        // Opzionale: se vuoi che il test fallisca se non raggiunge la soglia
        // autoUpdate: true 
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});