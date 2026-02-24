# @smooai/testing

Smoo AI Testing SDK — CLI and library for interacting with the Smoo AI Testing API.

Report test results, manage test runs, cases, environments, and deployments.

## Installation

```bash
npm install @smooai/testing
# or
pnpm add @smooai/testing
```

## Quick Start

### CLI: Report test results

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

### Library: Programmatic usage

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

## CLI Commands

### Authentication

```bash
smooai-testing login --client-id <id> --client-secret <secret> --org-id <id>
smooai-testing logout
smooai-testing status
```

### Test Runs

```bash
smooai-testing runs create --name "Run Name" [--environment prod] [--tool vitest]
smooai-testing runs list [--status passed] [--limit 10]
smooai-testing runs get <run-id>
smooai-testing runs update <run-id> --status completed
smooai-testing runs report <ctrf-file> [--name "Run"] [--environment prod]
```

### Test Cases

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

## JSON Output

All commands support `--json` for machine-readable output:

```bash
smooai-testing runs list --json | jq '.data[].id'
```

JSON mode is auto-enabled when output is piped (no TTY).

## CI/CD Usage

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

## Development

```bash
pnpm install
pnpm build        # Build lib + CLI
pnpm test         # Run unit tests
pnpm typecheck    # TypeScript checks
pnpm lint         # Lint
pnpm format       # Format code
pnpm check-all    # All checks (CI parity)
```

## License

MIT
