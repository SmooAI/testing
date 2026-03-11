import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { SmooTestingClient } from '../src/lib/index';

// Mock @smooai/fetch module
const { mockFetch } = vi.hoisted(() => ({
    mockFetch: vi.fn(),
}));
vi.mock('@smooai/fetch', () => ({
    default: mockFetch,
}));

describe('SmooTestingClient', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    function mockFetchSequence(...responses: Array<{ ok: boolean; status?: number; body?: unknown }>) {
        for (const resp of responses) {
            mockFetch.mockResolvedValueOnce({
                ok: resp.ok,
                status: resp.status ?? (resp.ok ? 200 : 500),
                statusText: resp.ok ? 'OK' : 'Error',
                json: () => Promise.resolve(resp.body),
                text: () => Promise.resolve(JSON.stringify(resp.body ?? '')),
            } as Response);
        }
        return mockFetch;
    }

    it('instantiates with required options', () => {
        const client = new SmooTestingClient({
            clientId: 'test-client',
            clientSecret: 'test-secret',
            orgId: 'org-123',
        });
        expect(client).toBeDefined();
    });

    it('creates a test run', async () => {
        const mockRun = { id: 'run-1', name: 'My Run', status: 'pending' };

        mockFetchSequence(
            { ok: true, body: { access_token: 'tok', expires_in: 3600 } }, // auth
            { ok: true, body: mockRun }, // create run
        );

        const client = new SmooTestingClient({
            clientId: 'test-client',
            clientSecret: 'test-secret',
            orgId: 'org-123',
            apiUrl: 'https://api.test.smoo.ai',
            authUrl: 'https://auth.test.smoo.ai/token',
        });

        const run = await client.createRun({ name: 'My Run' });
        expect(run.id).toBe('run-1');
        expect(run.name).toBe('My Run');
    });

    it('lists environments', async () => {
        const mockEnvs = [
            { id: 'env-1', name: 'production' },
            { id: 'env-2', name: 'staging' },
        ];

        mockFetchSequence({ ok: true, body: { access_token: 'tok', expires_in: 3600 } }, { ok: true, body: mockEnvs });

        const client = new SmooTestingClient({
            clientId: 'test-client',
            clientSecret: 'test-secret',
            orgId: 'org-123',
            apiUrl: 'https://api.test.smoo.ai',
            authUrl: 'https://auth.test.smoo.ai/token',
        });

        const envs = await client.listEnvironments();
        expect(envs).toHaveLength(2);
        expect(envs[0].name).toBe('production');
    });

    it('handles authentication failure', async () => {
        mockFetchSequence({ ok: false, status: 401, body: { error: 'invalid_client' } });

        const client = new SmooTestingClient({
            clientId: 'bad-client',
            clientSecret: 'bad-secret',
            orgId: 'org-123',
            apiUrl: 'https://api.test.smoo.ai',
            authUrl: 'https://auth.test.smoo.ai/token',
        });

        await expect(client.listEnvironments()).rejects.toThrow('Authentication failed');
    });

    it('uses default URLs when not provided', () => {
        const client = new SmooTestingClient({
            clientId: 'test-client',
            clientSecret: 'test-secret',
            orgId: 'org-123',
        });
        // Client should instantiate without error using defaults
        expect(client).toBeDefined();
    });
});
