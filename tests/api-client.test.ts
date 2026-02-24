import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { ApiClient } from '../src/cli/utils/api-client';
import { clearTokenCache } from '../src/cli/utils/auth';
import type { Credentials } from '../src/lib/types';

const mockCredentials: Credentials = {
    clientId: 'test-client',
    clientSecret: 'test-secret',
    orgId: 'org-123',
    apiUrl: 'https://api.test.smoo.ai',
    authUrl: 'https://auth.test.smoo.ai/token',
};

function mockAuthThenApi(apiResponse: { ok: boolean; status?: number; statusText?: string; body?: unknown }) {
    return vi
        .fn()
        .mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ access_token: 'test-token', expires_in: 3600 }),
            text: () => Promise.resolve(JSON.stringify({ access_token: 'test-token', expires_in: 3600 })),
        } as Response)
        .mockResolvedValueOnce({
            ok: apiResponse.ok,
            status: apiResponse.status ?? (apiResponse.ok ? 200 : 500),
            statusText: apiResponse.statusText ?? (apiResponse.ok ? 'OK' : 'Error'),
            text: () => Promise.resolve(typeof apiResponse.body === 'string' ? apiResponse.body : JSON.stringify(apiResponse.body ?? '')),
        } as Response);
}

describe('ApiClient', () => {
    let originalFetch: typeof global.fetch;

    beforeEach(() => {
        originalFetch = global.fetch;
        clearTokenCache(); // Clear cached auth token between tests
    });

    afterEach(() => {
        global.fetch = originalFetch;
        vi.restoreAllMocks();
    });

    it('constructs correct URLs with org path', () => {
        const client = new ApiClient(mockCredentials);
        expect(client).toBeDefined();
    });

    it('makes authenticated GET requests', async () => {
        const mockResponse = [{ id: 'env-1', name: 'production' }];
        global.fetch = mockAuthThenApi({ ok: true, body: mockResponse });

        const client = new ApiClient(mockCredentials);
        const result = await client.get('/testing/environments');

        expect(result).toEqual(mockResponse);
        expect(global.fetch).toHaveBeenCalledTimes(2);

        // Verify auth call
        const authCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(authCall[0]).toBe('https://auth.test.smoo.ai/token');

        // Verify API call
        const apiCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[1];
        expect(apiCall[0]).toBe('https://api.test.smoo.ai/organizations/org-123/testing/environments');
        expect(apiCall[1].headers.Authorization).toBe('Bearer test-token');
    });

    it('adds query params to GET requests', async () => {
        global.fetch = mockAuthThenApi({ ok: true, body: { data: [], pagination: {} } });

        const client = new ApiClient(mockCredentials);
        await client.get('/testing/runs', { status: 'passed', limit: 10 });

        const apiCall = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[1];
        const url = apiCall[0] as string;
        expect(url).toContain('status=passed');
        expect(url).toContain('limit=10');
    });

    it('retries once on 401 (token refresh)', async () => {
        global.fetch = vi
            .fn()
            // First auth
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ access_token: 'old-token', expires_in: 3600 }),
                text: () => Promise.resolve(JSON.stringify({ access_token: 'old-token', expires_in: 3600 })),
            } as Response)
            // First API call returns 401
            .mockResolvedValueOnce({
                ok: false,
                status: 401,
                statusText: 'Unauthorized',
                text: () => Promise.resolve('Token expired'),
            } as Response)
            // Re-auth
            .mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ access_token: 'new-token', expires_in: 3600 }),
                text: () => Promise.resolve(JSON.stringify({ access_token: 'new-token', expires_in: 3600 })),
            } as Response)
            // Retry API call succeeds
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                text: () => Promise.resolve(JSON.stringify({ id: 'run-1' })),
            } as Response);

        const client = new ApiClient(mockCredentials);
        const result = await client.get('/testing/runs/run-1');

        expect(result).toEqual({ id: 'run-1' });
        expect(global.fetch).toHaveBeenCalledTimes(4);
    });

    it('throws on non-401 errors', async () => {
        global.fetch = mockAuthThenApi({ ok: false, status: 404, statusText: 'Not Found', body: 'Resource not found' });

        const client = new ApiClient(mockCredentials);
        await expect(client.get('/testing/runs/nonexistent')).rejects.toThrow('API error: HTTP 404');
    });
});
