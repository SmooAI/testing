/**
 * E2E Integration test: Full report pipeline.
 *
 * Requires env vars:
 *   SMOOAI_CLIENT_ID, SMOOAI_CLIENT_SECRET, SMOOAI_ORG_ID,
 *   SMOOAI_API_URL, SMOOAI_AUTH_URL
 *
 * Run: pnpm test:integration:e2e (or pnpm sst shell -- vitest run e2e/)
 */

import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { describe, expect, it, beforeAll } from 'vitest';
import { SmooTestingClient } from '../src/lib/index';

const TMP_DIR = join(__dirname, '__e2e_tmp__');

function getClient(): SmooTestingClient {
    const clientId = process.env.SMOOAI_CLIENT_ID;
    const clientSecret = process.env.SMOOAI_CLIENT_SECRET;
    const orgId = process.env.SMOOAI_ORG_ID;

    if (!clientId || !clientSecret || !orgId) {
        throw new Error('E2E test requires SMOOAI_CLIENT_ID, SMOOAI_CLIENT_SECRET, and SMOOAI_ORG_ID env vars');
    }

    return new SmooTestingClient({
        clientId,
        clientSecret,
        orgId,
        apiUrl: process.env.SMOOAI_API_URL,
        authUrl: process.env.SMOOAI_AUTH_URL,
    });
}

describe('Report Flow E2E', () => {
    beforeAll(() => {
        mkdirSync(TMP_DIR, { recursive: true });
    });

    it('creates a run, submits CTRF results, and verifies', async () => {
        const client = getClient();

        // Create a test CTRF file
        const ctrfReport = {
            results: {
                tool: { name: 'vitest', version: '1.0.0' },
                summary: { tests: 3, passed: 2, failed: 1, skipped: 0, pending: 0, other: 0 },
                tests: [
                    { name: 'test-a', status: 'passed', duration: 100 },
                    { name: 'test-b', status: 'passed', duration: 200 },
                    { name: 'test-c', status: 'failed', duration: 50, message: 'assertion error' },
                ],
            },
        };

        const ctrfPath = join(TMP_DIR, 'e2e-report.json');
        writeFileSync(ctrfPath, JSON.stringify(ctrfReport));

        // Use the high-level report method
        const run = await client.report(ctrfPath, {
            name: `E2E Test Run ${Date.now()}`,
            environment: 'e2e-testing',
        });

        expect(run).toBeDefined();
        expect(run.id).toBeTruthy();
        expect(run.status).toBe('failed'); // 1 failed test
        expect(run.summary).toBeDefined();
        expect(run.summary?.passed).toBe(2);
        expect(run.summary?.failed).toBe(1);

        // Verify we can fetch the run
        const fetched = await client.getRun(run.id);
        expect(fetched.id).toBe(run.id);
        expect(fetched.results).toBeDefined();
        expect(fetched.results!.length).toBe(3);

        // Cleanup
        rmSync(TMP_DIR, { recursive: true, force: true });
    });

    it('manages environments CRUD', async () => {
        const client = getClient();
        const name = `e2e-env-${Date.now()}`;

        // Create
        const env = await client.createEnvironment({ name, description: 'E2E test env' });
        expect(env.id).toBeTruthy();
        expect(env.name).toBe(name);

        // List
        const envs = await client.listEnvironments();
        expect(envs.some((e) => e.id === env.id)).toBe(true);

        // Update
        const updated = await client.updateEnvironment(env.id, { description: 'Updated' });
        expect(updated.description).toBe('Updated');
    });

    it('manages deployments CRUD', async () => {
        const client = getClient();
        const name = `e2e-deploy-${Date.now()}`;

        // Create
        const deployment = await client.createDeployment({
            name,
            source: 'github',
            ref: 'main',
        });
        expect(deployment.id).toBeTruthy();

        // Get
        const fetched = await client.getDeployment(deployment.id);
        expect(fetched.name).toBe(name);

        // Update
        const updated = await client.updateDeployment(deployment.id, { status: 'success' });
        expect(updated.status).toBe('success');

        // Delete
        await client.deleteDeployment(deployment.id);
    });
});
