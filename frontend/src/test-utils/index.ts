/**
 * Test Utilities Index
 * 
 * Shared test utilities for unit and integration tests.
 * Import from '@/test-utils' in your test files.
 * 
 * Setup:
 * 1. Install testing dependencies:
 *    npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
 * 
 * 2. Add to vite.config.ts:
 *    test: {
 *      globals: true,
 *      environment: 'jsdom',
 *      setupFiles: './src/test-utils/setup.ts',
 *    }
 * 
 * 3. Add to tsconfig.json compilerOptions:
 *    "types": ["vitest/globals", "@testing-library/jest-dom"]
 */

export { renderWithProviders, createMockUser, createMockStudent, createMockAdmin } from './render'
export { mockAuthContext, mockToastContext, mockThemeContext } from './mocks'
