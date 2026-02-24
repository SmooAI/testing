import { defineConfig, type Options } from 'tsup';

export default defineConfig((options: Options) => ({
    entry: ['src/index.ts', 'src/lib/types.ts'],
    clean: true,
    dts: true,
    format: ['cjs', 'esm'],
    sourcemap: true,
    target: 'es2022',
    treeShaking: true,
    ...options,
}));
