# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

**Use Context7 MCP server for up-to-date library documentation.**

## Project Overview

`@smooai/testing` is a testing SDK that provides both a CLI and a library for managing test runs, cases, environments, and deployments via the Smoo AI Testing API. The CLI uses Ink (React for terminals) with M2M authentication support.

### Language & Toolchain

- **TypeScript + TSX** — pnpm, tsup, Ink (React for terminal UI)

---

## 1. Build, Test, and Development Commands

```bash
pnpm install              # Install dependencies
pnpm build                # Build lib + CLI via tsup
pnpm build:lib            # Build library only
pnpm build:cli            # Build CLI only
pnpm test                 # Run Vitest tests
pnpm test:integration     # Run integration tests
pnpm typecheck            # TypeScript type checking
pnpm lint                 # ESLint
pnpm format               # Auto-format code
pnpm format:check         # Check formatting without fixing
pnpm check-all            # Full CI parity (typecheck, lint, test, build)
pnpm pre-commit-check     # Quick pre-commit validation
```

### CLI

The CLI binary is `smooai-testing` and uses Ink (React) for terminal UI rendering with M2M authentication support.

---

## 2. Git Workflow — Worktrees

### Working directory structure

All work happens from `~/dev/smooai/`. The main worktree is at `~/dev/smooai/testing/`. Feature worktrees live alongside it:

```
~/dev/smooai/
├── testing/                             # Main worktree (ALWAYS on main)
├── testing-SMOODEV-XX-short-desc/       # Feature worktree
└── ...
```

**IMPORTANT:** `~/dev/smooai/testing/` must ALWAYS stay on the `main` branch. **Never do feature work directly on main.** All feature work goes in worktrees.

### Branch naming

Always prefix with the Jira ticket number:

```
SMOODEV-XX-short-description
```

### Commit messages

Always prefix with the Jira ticket. Explain **why**, not just what:

```
SMOODEV-XX: Add retry logic for flaky test environment provisioning
```

### Creating a worktree

```bash
cd ~/dev/smooai/testing
git worktree add ../testing-SMOODEV-XX-short-desc -b SMOODEV-XX-short-desc main

cd ../testing-SMOODEV-XX-short-desc
pnpm install
```

### Merging to main

```bash
cd ~/dev/smooai/testing
git checkout main && git pull --rebase
git merge SMOODEV-XX-short-desc --no-ff
git push
```

### Cleanup after merge

```bash
git worktree remove ~/dev/smooai/testing-SMOODEV-XX-short-desc
git branch -d SMOODEV-XX-short-desc
```

---

## 3. Coding Style

- ESLint + Prettier, 4-space indentation, trailing commas, 160-character line width
- Organized imports
- TSX for Ink CLI components (React for terminal)
- Run `pnpm format` before committing

---

## 4. Testing Guidelines

- **Unit tests**: Vitest, colocated as `*.test.ts`
- **Integration tests**: `pnpm test:integration` for cross-service flows
- Every batch of work MUST include unit tests
- All tests must pass before landing code

---

## 5. Changesets & Versioning

Always add changesets when `@smooai/testing` changes:

```bash
pnpm changeset
```

---

## 6. CI / GitHub Actions

CI runs on every PR: typecheck, lint, format check, test, build.

```bash
gh run list                          # List recent workflow runs
gh run view <run-id> --log-failed    # View failed step logs
```

CI must be green before merging.

---

## 7. Pre-Push Checklist

Before merging and pushing, verify:

1. `pnpm check-all` passes
2. Changeset added if needed
3. All changes committed and pushed
