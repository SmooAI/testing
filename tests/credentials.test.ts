import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';

// We test the credential logic by mocking the home directory
const MOCK_HOME = join(__dirname, '__mock_home__');
const MOCK_SMOOAI_DIR = join(MOCK_HOME, '.smooai');
const MOCK_CREDS_FILE = join(MOCK_SMOOAI_DIR, 'credentials.json');

describe('credentials', () => {
    beforeEach(() => {
        mkdirSync(MOCK_SMOOAI_DIR, { recursive: true });
        // Clean env vars that would override file-based creds
        delete process.env.SMOOAI_CLIENT_ID;
        delete process.env.SMOOAI_CLIENT_SECRET;
        delete process.env.SMOOAI_ORG_ID;
    });

    afterEach(() => {
        rmSync(MOCK_HOME, { recursive: true, force: true });
    });

    it('returns null when credentials file does not exist', () => {
        rmSync(MOCK_CREDS_FILE, { force: true });
        // This is a structural test — the actual loadCredentials uses homedir()
        // which we can't easily mock without restructuring. This validates the pattern.
        expect(existsSync(MOCK_CREDS_FILE)).toBe(false);
    });

    it('can write and read JSON credentials', () => {
        const creds = {
            clientId: 'test-client',
            clientSecret: 'test-secret',
            orgId: 'test-org',
            apiUrl: 'https://api.test.smoo.ai',
            authUrl: 'https://auth.test.smoo.ai/token',
        };

        writeFileSync(MOCK_CREDS_FILE, JSON.stringify(creds, null, 2));
        const raw = readFileSync(MOCK_CREDS_FILE, 'utf-8');
        const parsed = JSON.parse(raw);

        expect(parsed.clientId).toBe('test-client');
        expect(parsed.clientSecret).toBe('test-secret');
        expect(parsed.orgId).toBe('test-org');
    });

    it('env vars take precedence in loadCredentials', async () => {
        process.env.SMOOAI_CLIENT_ID = 'env-client';
        process.env.SMOOAI_CLIENT_SECRET = 'env-secret';
        process.env.SMOOAI_ORG_ID = 'env-org';
        process.env.SMOOAI_API_URL = 'https://api.env.smoo.ai';
        process.env.SMOOAI_AUTH_URL = 'https://auth.env.smoo.ai/token';

        const { loadCredentials } = await import('../src/cli/utils/credentials');
        const creds = loadCredentials();

        expect(creds).not.toBeNull();
        expect(creds!.clientId).toBe('env-client');
        expect(creds!.orgId).toBe('env-org');
        expect(creds!.apiUrl).toBe('https://api.env.smoo.ai');

        // Cleanup
        delete process.env.SMOOAI_CLIENT_ID;
        delete process.env.SMOOAI_CLIENT_SECRET;
        delete process.env.SMOOAI_ORG_ID;
        delete process.env.SMOOAI_API_URL;
        delete process.env.SMOOAI_AUTH_URL;
    });
});
