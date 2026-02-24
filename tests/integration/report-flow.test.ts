/**
 * Integration tests for the report pipeline and CRUD flows.
 *
 * These tests mock HTTP (global.fetch) to verify the SmooTestingClient
 * orchestrates calls correctly. CTRF file I/O stays real.
 *
 * Run: pnpm test:integration
 */

import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { describe, expect, it, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import { SmooTestingClient } from '../../src/lib/index';

const TMP_DIR = join(__dirname, '__integration_tmp__');

const CLIENT_OPTIONS = {
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    orgId: 'org-test-123',
    apiUrl: 'https://api.test.smoo.ai',
    authUrl: 'https://auth.test.smoo.ai/token',
};

let originalFetch: typeof global.fetch;

function authResponse() {
    return { ok: true, body: { access_token: 'mock-token', expires_in: 3600 } };
}

function mockFetchSequence(...responses: Array<{ ok: boolean; status?: number; body?: unknown }>) {
    const mock = vi.fn();
    for (const resp of responses) {
        mock.mockResolvedValueOnce({
            ok: resp.ok,
            status: resp.status ?? (resp.ok ? 200 : 500),
            statusText: resp.ok ? 'OK' : 'Error',
            json: () => Promise.resolve(resp.body),
            text: () => Promise.resolve(JSON.stringify(resp.body ?? '')),
        } as Response);
    }
    global.fetch = mock;
    return mock;
}

describe('Report Flow Integration (mocked HTTP)', () => {
    beforeEach(() => {
        originalFetch = global.fetch;
    });

    afterEach(() => {
        global.fetch = originalFetch;
        vi.restoreAllMocks();
    });

    beforeAll(() => {
        mkdirSync(TMP_DIR, { recursive: true });
    });

    afterAll(() => {
        rmSync(TMP_DIR, { recursive: true, force: true });
    });

    it('creates a run, submits CTRF results, and verifies', async () => {
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

        const ctrfPath = join(TMP_DIR, 'integration-report.json');
        writeFileSync(ctrfPath, JSON.stringify(ctrfReport));

        const mockRun = {
            id: 'run-int-1',
            name: 'Integration Test Run',
            status: 'pending',
            summary: null,
            organizationId: CLIENT_OPTIONS.orgId,
            environmentId: null,
            deploymentId: null,
            tool: 'vitest',
            durationMs: null,
            runnerName: null,
            runnerUrl: null,
            startedAt: null,
            completedAt: null,
            metadata: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const mockRunAfterResults = {
            ...mockRun,
            status: 'failed',
            summary: { passed: 2, failed: 1, total: 3, skipped: 0, pending: 0, other: 0 },
            results: ctrfReport.results.tests,
        };

        const mock = mockFetchSequence(
            authResponse(), // auth for createRun
            { ok: true, body: mockRun }, // createRun
            { ok: true, body: { count: 3 } }, // submitResults (token cached)
            { ok: true, body: mockRunAfterResults }, // getRun
        );

        const client = new SmooTestingClient(CLIENT_OPTIONS);
        const run = await client.report(ctrfPath, {
            name: 'Integration Test Run',
            environment: 'integration-testing',
        });

        expect(run).toBeDefined();
        expect(run.id).toBe('run-int-1');
        expect(run.status).toBe('failed');
        expect(run.summary?.passed).toBe(2);
        expect(run.summary?.failed).toBe(1);

        // Verify correct API calls were made
        expect(mock).toHaveBeenCalledTimes(4);

        // Verify auth call
        const authCall = mock.mock.calls[0];
        expect(authCall[0]).toBe('https://auth.test.smoo.ai/token');

        // Verify createRun call
        const createCall = mock.mock.calls[1];
        expect(createCall[0]).toContain('/testing/runs');
        expect(createCall[1].method).toBe('POST');

        // Verify submitResults call
        const submitCall = mock.mock.calls[2];
        expect(submitCall[0]).toContain('/testing/runs/run-int-1/results');

        // Verify getRun call
        const getCall = mock.mock.calls[3];
        expect(getCall[0]).toContain('/testing/runs/run-int-1');
        expect(getCall[1].method).toBe('GET');
    });

    it('manages environments CRUD', async () => {
        const mockEnv = {
            id: 'env-int-1',
            organizationId: CLIENT_OPTIONS.orgId,
            name: 'int-test-env',
            description: 'Integration test env',
            baseUrl: null,
            metadata: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const mock = mockFetchSequence(
            authResponse(), // auth for createEnvironment
            { ok: true, status: 201, body: mockEnv }, // createEnvironment
            { ok: true, body: [mockEnv] }, // listEnvironments (token cached)
            { ok: true, body: { ...mockEnv, description: 'Updated' } }, // updateEnvironment
        );

        const client = new SmooTestingClient(CLIENT_OPTIONS);

        // Create
        const env = await client.createEnvironment({ name: 'int-test-env', description: 'Integration test env' });
        expect(env.id).toBe('env-int-1');
        expect(env.name).toBe('int-test-env');

        // List
        const envs = await client.listEnvironments();
        expect(envs.some((e) => e.id === env.id)).toBe(true);

        // Update
        const updated = await client.updateEnvironment(env.id, { description: 'Updated' });
        expect(updated.description).toBe('Updated');

        // Verify correct API calls
        expect(mock).toHaveBeenCalledTimes(4); // auth + 3 API calls

        const createCall = mock.mock.calls[1];
        expect(createCall[0]).toContain('/testing/environments');
        expect(createCall[1].method).toBe('POST');

        const listCall = mock.mock.calls[2];
        expect(listCall[0]).toContain('/testing/environments');
        expect(listCall[1].method).toBe('GET');

        const updateCall = mock.mock.calls[3];
        expect(updateCall[0]).toContain(`/testing/environments/${env.id}`);
        expect(updateCall[1].method).toBe('PATCH');
    });

    it('manages deployments CRUD', async () => {
        const mockDeployment = {
            id: 'deploy-int-1',
            organizationId: CLIENT_OPTIONS.orgId,
            environmentId: null,
            name: 'int-test-deploy',
            status: 'pending',
            source: 'github',
            externalId: null,
            externalUrl: null,
            ref: 'main',
            metadata: null,
            startedAt: null,
            completedAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const mock = mockFetchSequence(
            authResponse(), // auth for createDeployment
            { ok: true, status: 201, body: mockDeployment }, // createDeployment
            { ok: true, body: mockDeployment }, // getDeployment (token cached)
            { ok: true, body: { ...mockDeployment, status: 'success' } }, // updateDeployment
            { ok: true, status: 200, body: undefined }, // deleteDeployment
        );

        const client = new SmooTestingClient(CLIENT_OPTIONS);

        // Create
        const deployment = await client.createDeployment({
            name: 'int-test-deploy',
            source: 'github',
            ref: 'main',
        });
        expect(deployment.id).toBe('deploy-int-1');

        // Get
        const fetched = await client.getDeployment(deployment.id);
        expect(fetched.name).toBe('int-test-deploy');

        // Update
        const updated = await client.updateDeployment(deployment.id, { status: 'success' });
        expect(updated.status).toBe('success');

        // Delete
        await client.deleteDeployment(deployment.id);

        // Verify correct API calls
        expect(mock).toHaveBeenCalledTimes(5); // auth + 4 API calls

        const createCall = mock.mock.calls[1];
        expect(createCall[0]).toContain('/testing/deployments');
        expect(createCall[1].method).toBe('POST');

        const getCall = mock.mock.calls[2];
        expect(getCall[0]).toContain(`/testing/deployments/${deployment.id}`);
        expect(getCall[1].method).toBe('GET');

        const updateCall = mock.mock.calls[3];
        expect(updateCall[0]).toContain(`/testing/deployments/${deployment.id}`);
        expect(updateCall[1].method).toBe('PATCH');

        const deleteCall = mock.mock.calls[4];
        expect(deleteCall[0]).toContain(`/testing/deployments/${deployment.id}`);
        expect(deleteCall[1].method).toBe('DELETE');
    });
});
