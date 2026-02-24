/**
 * HTTP client wrapper with M2M auth for the Smoo AI Testing API.
 */

import type { Credentials } from '../../lib/types';
import { clearTokenCache, getAuthToken } from './auth';

export class ApiClient {
    private credentials: Credentials;
    private baseUrl: string;

    constructor(credentials: Credentials) {
        this.credentials = credentials;
        this.baseUrl = credentials.apiUrl.replace(/\/+$/, '');
    }

    private orgPath(path: string): string {
        return `${this.baseUrl}/organizations/${this.credentials.orgId}${path}`;
    }

    private async request<T>(method: string, url: string, body?: unknown, retry = true): Promise<T> {
        const token = await getAuthToken(this.credentials);

        const response = await fetch(url, {
            method,
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: body != null ? JSON.stringify(body) : undefined,
        });

        // Retry once on 401 (token may have expired)
        if (response.status === 401 && retry) {
            clearTokenCache();
            return this.request<T>(method, url, body, false);
        }

        if (!response.ok) {
            const errorBody = await response.text().catch(() => '');
            throw new Error(`API error: HTTP ${response.status} ${response.statusText}${errorBody ? ` — ${errorBody}` : ''}`);
        }

        const text = await response.text();
        if (!text) return undefined as T;
        return JSON.parse(text) as T;
    }

    async get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
        let url = this.orgPath(path);
        if (params) {
            const searchParams = new URLSearchParams();
            for (const [key, value] of Object.entries(params)) {
                if (value != null) searchParams.set(key, String(value));
            }
            const qs = searchParams.toString();
            if (qs) url += `?${qs}`;
        }
        return this.request<T>('GET', url);
    }

    async post<T>(path: string, body?: unknown): Promise<T> {
        return this.request<T>('POST', this.orgPath(path), body);
    }

    async patch<T>(path: string, body?: unknown): Promise<T> {
        return this.request<T>('PATCH', this.orgPath(path), body);
    }

    async delete<T>(path: string): Promise<T> {
        return this.request<T>('DELETE', this.orgPath(path));
    }
}
