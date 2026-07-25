---
'@smooai/testing': minor
---

SMOODEV-2721: coverage API — `reportCoverage()`, `listCoverage()` (incl. `latest=true` per-scope baseline), exported `parseLcov()` (LF/LH with DA-fallback), and the high-level `reportCoverageFromLcov(path, { scope, branch, commitSha })` that parses an lcov.info and uploads totals + per-file counters (per-file dropped above the API's 5000-file cap).
