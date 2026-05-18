---
'@smooai/testing': patch
---

Migrate build tooling from tsup to tsdown — faster, oxc-based, drop-in replacement. The lib build emits `.cjs`/`.mjs`/`.d.cts`/`.d.mts` (vs tsup's `.js`/`.mjs`/`.d.ts`); the `exports` map is updated to match. The CLI bin (`smooai-testing`) still ships as `cli.mjs` with the same `#!/usr/bin/env node` shebang and the same `react-devtools-core` shim, just via `@rollup/plugin-alias` instead of esbuild's alias hook. No public API change.
