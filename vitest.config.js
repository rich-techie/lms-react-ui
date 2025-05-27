// vitest.config.js
import { defineConfig } from 'vitest/config'; // Import defineConfig from vitest/config

export default defineConfig({
  test: {
    globals: true, // This makes `expect`, `test`, `describe`, etc. global
    environment: 'jsdom', // This provides a DOM-like environment for React component testing
    setupFiles: './src/setupTests.js', // For global setup like @testing-library/jest-dom imports
    testTimeout: 10000, // Increase global test timeout to 10 seconds (10000ms)
  },
});

console.log('vitest.config.js loaded by Vitest!'); // Add this line to confirm loading
