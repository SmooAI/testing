/**
 * Manage CLI credentials stored at ~/.smooai/credentials.json.
 * Shared with @smooai/config — same file, extended fields for M2M auth.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import type { Credentials } from '../../lib/types';

const SMOOAI_DIR = join(homedir(), '.smooai');
const CREDENTIALS_FILE = join(SMOOAI_DIR, 'credentials.json');

const DEFAULT_API_URL = 'https://api.production.smoo.ai';
const DEFAULT_AUTH_URL = 'https://auth.production.smoo.ai/token';

export function loadCredentials(): Credentials | null {
    // Try env vars first (CI environments)
    const envClientId = process.env.SMOOAI_CLIENT_ID;
    const envClientSecret = process.env.SMOOAI_CLIENT_SECRET;
    const envOrgId = process.env.SMOOAI_ORG_ID;

    if (envClientId && envClientSecret && envOrgId) {
        return {
            clientId: envClientId,
            clientSecret: envClientSecret,
            orgId: envOrgId,
            apiUrl: process.env.SMOOAI_API_URL || DEFAULT_API_URL,
            authUrl: process.env.SMOOAI_AUTH_URL || DEFAULT_AUTH_URL,
        };
    }

    // Fall back to credentials file
    try {
        if (!existsSync(CREDENTIALS_FILE)) return null;
        const raw = readFileSync(CREDENTIALS_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!parsed.clientId || !parsed.clientSecret || !parsed.orgId) return null;
        return {
            clientId: parsed.clientId,
            clientSecret: parsed.clientSecret,
            orgId: parsed.orgId,
            apiUrl: parsed.apiUrl || DEFAULT_API_URL,
            authUrl: parsed.authUrl || DEFAULT_AUTH_URL,
        };
    } catch {
        return null;
    }
}

export function saveCredentials(credentials: Credentials): void {
    mkdirSync(SMOOAI_DIR, { recursive: true });

    // Merge with existing credentials to preserve other SDK fields
    let existing: Record<string, unknown> = {};
    try {
        if (existsSync(CREDENTIALS_FILE)) {
            existing = JSON.parse(readFileSync(CREDENTIALS_FILE, 'utf-8'));
        }
    } catch {
        // ignore
    }

    const merged = { ...existing, ...credentials };
    writeFileSync(CREDENTIALS_FILE, JSON.stringify(merged, null, 2), { mode: 0o600 });
}

export function clearCredentials(): void {
    if (!existsSync(CREDENTIALS_FILE)) return;

    try {
        const existing = JSON.parse(readFileSync(CREDENTIALS_FILE, 'utf-8'));
        // Remove only testing SDK fields, preserve @smooai/config fields
        delete existing.clientId;
        delete existing.clientSecret;
        // Keep orgId, apiUrl, authUrl as they may be shared
        writeFileSync(CREDENTIALS_FILE, JSON.stringify(existing, null, 2), { mode: 0o600 });
    } catch {
        // ignore
    }
}

export function getCredentialsOrExit(): Credentials {
    const creds = loadCredentials();
    if (!creds) {
        console.error('Not logged in. Run `smooai-testing login` first, or set SMOOAI_CLIENT_ID, SMOOAI_CLIENT_SECRET, and SMOOAI_ORG_ID env vars.');
        process.exit(1);
    }
    return creds;
}
