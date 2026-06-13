<a name="readme-top"></a>

<p align="center">
  <a href="https://smoo.ai"><img src="https://smoo.ai/images/logo/logo.svg" alt="Smoo AI" width="220" /></a>
</p>

<h1 align="center">@smooai/testing</h1>

<p align="center">
  <strong>CLI and library for the Smoo AI Testing API — report test results and manage runs, cases, environments, and deployments.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@smooai/testing"><img src="https://img.shields.io/npm/v/@smooai/testing?style=flat-square&color=00A6A6&label=npm" alt="npm"></a>
  <a href="https://www.npmjs.com/package/@smooai/testing"><img src="https://img.shields.io/npm/dw/@smooai/testing?style=flat-square&color=F49F0A&label=downloads" alt="downloads"></a>
  <img src="https://img.shields.io/badge/Smoo_AI-platform-00A6A6?style=flat-square" alt="Smoo AI">
  <img src="https://img.shields.io/badge/license-MIT-F49F0A?style=flat-square" alt="license">
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript">
</p>

<p align="center">
  <a href="#features">Features</a> ·
  <a href="#install">Install</a> ·
  <a href="#usage">Usage</a> ·
  <a href="#cli-commands">CLI</a> ·
  <a href="#part-of-smoo-ai">Platform</a>
</p>

---

> Report test results to Smoo AI and manage your test program from the command line or in code. Pipe CTRF reports straight from CI, or drive runs, cases, environments, and deployments programmatically.

## ✨ Features <a name="features"></a>

- Report CTRF test results from any test runner, straight from CI
- Manage test runs, cases, environments, and deployments
- Use it as a CLI or as a typed TypeScript library
- `--json` output on every command (auto-enabled when piped)
- M2M auth via `login` or environment variables for CI/CD

## 📦 Install <a name="install"></a>

```bash
npm install @smooai/testing
# or
pnpm add @smooai/testing
```

## 🚀 Usage <a name="usage"></a>

### CLI: report test results

```bash
# Authenticate
npx @smooai/testing login \
  --client-id <M2M_CLIENT_ID> \
  --client-secret <M2M_CLIENT_SECRET> \
  --org-id <ORG_ID>

# Report CTRF test results
npx @smooai/testing runs report ctrf-report.json \
  --environment production \
  --name "PR #42 Tests"
```

### Library: programmatic usage

```typescript
import { SmooTestingClient } from '@smooai/testing';

const client = new SmooTestingClient({
    clientId: process.env.SMOOAI_CLIENT_ID,
    clientSecret: process.env.SMOOAI_CLIENT_SECRET,
    orgId: process.env.SMOOAI_ORG_ID,
});

// High-level: report CTRF file
const run = await client.report('ctrf-report.json', {
    name: 'My Test Run',
    environment: 'production',
});

// Or use individual methods
const runs = await client.listRuns({ status: 'failed' });
const envs = await client.listEnvironments();
```

## 📖 CLI commands <a name="cli-commands"></a>

### Authentication

```bash
smooai-testing login --client-id <id> --client-secret <secret> --org-id <id>
smooai-testing logout
smooai-testing status
```

### Test runs

```bash
smooai-testing runs create --name "Run Name" [--environment prod] [--tool vitest]
smooai-testing runs list [--status passed] [--limit 10]
smooai-testing runs get <run-id>
smooai-testing runs update <run-id> --status completed
smooai-testing runs report <ctrf-file> [--name "Run"] [--environment prod]
```

### Test cases

```bash
smooai-testing cases create --title "Test login flow" [--priority high] [--tags "auth,e2e"]
smooai-testing cases list [--tags auth] [--priority high]
smooai-testing cases get <case-id>
smooai-testing cases update <case-id> --title "Updated title"
smooai-testing cases delete <case-id>
```

### Environments

```bash
smooai-testing envs create --name "production" [--base-url https://app.example.com]
smooai-testing envs list
smooai-testing envs get <env-id>
smooai-testing envs update <env-id> --name "staging"
```

### Deployments

```bash
smooai-testing deployments create --name "v1.2.3" [--source github] [--ref main]
smooai-testing deployments list [--status success]
smooai-testing deployments get <deployment-id>
smooai-testing deployments update <deployment-id> --status success
smooai-testing deployments delete <deployment-id>
```

### JSON output

All commands support `--json` for machine-readable output:

```bash
smooai-testing runs list --json | jq '.data[].id'
```

JSON mode is auto-enabled when output is piped (no TTY).

## 🤖 CI/CD usage

Set environment variables instead of using `login`:

```bash
export SMOOAI_CLIENT_ID=...
export SMOOAI_CLIENT_SECRET=...
export SMOOAI_ORG_ID=...
export SMOOAI_API_URL=https://api.production.smoo.ai
export SMOOAI_AUTH_URL=https://auth.production.smoo.ai/token
```

GitHub Actions example:

```yaml
- name: Report test results
  run: npx @smooai/testing runs report ctrf-report.json --environment ci --name "${{ github.workflow }}"
  env:
      SMOOAI_CLIENT_ID: ${{ secrets.SMOOAI_CLIENT_ID }}
      SMOOAI_CLIENT_SECRET: ${{ secrets.SMOOAI_CLIENT_SECRET }}
      SMOOAI_ORG_ID: ${{ secrets.SMOOAI_ORG_ID }}
```

## 🔧 Development

```bash
pnpm install
pnpm build        # Build lib + CLI
pnpm test         # Run unit tests
pnpm typecheck    # TypeScript checks
pnpm lint         # Lint
pnpm format       # Format code
pnpm check-all    # All checks (CI parity)
```

## 🧩 Part of Smoo AI <a name="part-of-smoo-ai"></a>

@smooai/testing is part of the [Smoo AI](https://smoo.ai) platform — an AI-powered business platform with AI built into every product. It's the client for our hosted Testing API; the rest of the platform shares the same open-source toolbox.

- [@smooai/utils](https://github.com/SmooAI/utils) — foundational TypeScript utilities
- [@smooai/logger](https://github.com/SmooAI/logger) — contextual structured logging
- [@smooai/fetch](https://github.com/SmooAI/fetch) — typed HTTP with retries
- [@smooai/config](https://github.com/SmooAI/config) — typed config, secrets, and feature flags

Browse everything at [github.com/SmooAI](https://github.com/SmooAI).

## 📄 License <a name="license"></a>

MIT

---

<p align="center">
  Built by <a href="https://smoo.ai"><strong>Smoo AI</strong></a> — AI built into every product.
</p>
