/**
 * M2M token exchange for CLI authentication.
 * Authenticates via client_credentials grant type against the Smoo AI auth service.
 */

import fetch from '@smooai/fetch';
import type { Credentials, TokenResponse } from '../../lib/types';

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

export async function getAuthToken(credentials: Credentials): Promise<string> {
    // Return cached token if still valid (with 60s buffer)
    if (cachedToken && Date.now() < tokenExpiresAt - 60_000) {
        return cachedToken;
    }

    const response = await fetch(credentials.authUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'client_credentials',
            provider: 'client_credentials',
            client_id: credentials.clientId,
            client_secret: credentials.clientSecret,
        }),
    });

    if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`Authentication failed: HTTP ${response.status}${body ? ` — ${body}` : ''}`);
    }

    const data = (await response.json()) as TokenResponse;

    if (!data.access_token) {
        throw new Error('Authentication failed: no access_token in response');
    }

    cachedToken = data.access_token;
    // Default to 1h TTL if not specified
    tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;

    return cachedToken;
}

export function clearTokenCache(): void {
    cachedToken = null;
    tokenExpiresAt = 0;
}
