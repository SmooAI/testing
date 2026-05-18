import { resolve } from 'path';
import alias from '@rollup/plugin-alias';
import { defineConfig } from 'tsdown';

export default defineConfig({
    entry: { cli: 'src/cli/index.ts' },
    outDir: 'dist',
    format: ['esm'],
    target: 'node20',
    platform: 'node',
    sourcemap: true,
    clean: false, // Don't clean — shared dist/ with library build
    // Shim react-devtools-core to avoid runtime dependency
    plugins: [
        alias({
            entries: [{ find: 'react-devtools-core', replacement: resolve('src/cli/shims/react-devtools-core.ts') }],
        }),
    ],
    outputOptions: {
        banner: '#!/usr/bin/env node',
        entryFileNames: '[name].mjs',
    },
});
