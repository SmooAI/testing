import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [tsconfigPaths()],
    test: {
        include: ['e2e/**/*.test.ts'],
        testTimeout: 30_000,
    },
});
