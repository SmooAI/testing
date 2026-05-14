/**
 * SmooTestingClient — programmatic library for the Smoo AI Testing API.
 */

import { readFileSync } from 'fs';
import fetch from '@smooai/fetch';
import type {
    CtrfReport,
    CreateDeploymentInput,
    CreateTestCaseInput,
    CreateTestEnvironmentInput,
    CreateTestRunInput,
    Credentials,
    Deployment,
    ListDeploymentsFilters,
    ListTestCasesFilters,
    ListTestRunsFilters,
    PaginatedResponse,
    SmooTestingClientOptions,
    TestCase,
    TestEnvironment,
    TestRun,
    TokenResponse,
    UpdateDeploymentInput,
    UpdateTestCaseInput,
    UpdateTestEnvironmentInput,
    UpdateTestRunInput,
} from './types';

const DEFAULT_API_URL = 'https://api.production.smoo.ai';
const DEFAULT_AUTH_URL = 'https://auth.production.smoo.ai/token';

export class SmooTestingClient {
    private credentials: Credentials;
    private token: string | null = null;
    private tokenExpiresAt = 0;

    constructor(options: SmooTestingClientOptions) {
        this.credentials = {
            clientId: options.clientId,
            clientSecret: options.clientSecret,
            orgId: options.orgId,
            apiUrl: (options.apiUrl ?? DEFAULT_API_URL).replace(/\/+$/, ''),
            authUrl: options.authUrl ?? DEFAULT_AUTH_URL,
        };
    }

    // ── Auth ──

    private async authenticate(): Promise<string> {
        if (this.token && Date.now() < this.tokenExpiresAt - 60_000) {
            return this.token;
        }

        const response = await fetch(this.credentials.authUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'client_credentials',
                provider: 'client_credentials',
                client_id: this.credentials.clientId,
                client_secret: this.credentials.clientSecret,
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

        this.token = data.access_token;
        this.tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;
        return this.token;
    }

    private async request<T>(method: string, path: string, body?: unknown, retry = true): Promise<T> {
        const token = await this.authenticate();
        const url = `${this.credentials.apiUrl}/organizations/${this.credentials.orgId}${path}`;

        const response = await fetch(url, {
            method,
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: body != null ? JSON.stringify(body) : undefined,
        });

        if (response.status === 401 && retry) {
            this.token = null;
            this.tokenExpiresAt = 0;
            return this.request<T>(method, path, body, false);
        }

        if (!response.ok) {
            const errorBody = await response.text().catch(() => '');
            throw new Error(`API error: HTTP ${response.status} ${response.statusText}${errorBody ? ` — ${errorBody}` : ''}`);
        }

        const text = await response.text();
        if (!text) return undefined as T;
        return JSON.parse(text) as T;
    }

    private buildQueryString(params?: Record<string, string | number | undefined>): string {
        if (!params) return '';
        const sp = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
            if (value != null) sp.set(key, String(value));
        }
        const qs = sp.toString();
        return qs ? `?${qs}` : '';
    }

    // ── Test Runs ──

    async createRun(input: CreateTestRunInput): Promise<TestRun> {
        return this.request<TestRun>('POST', '/testing/runs', input);
    }

    async listRuns(filters?: ListTestRunsFilters): Promise<PaginatedResponse<TestRun>> {
        const qs = this.buildQueryString(filters as Record<string, string | number | undefined>);
        return this.request<PaginatedResponse<TestRun>>('GET', `/testing/runs${qs}`);
    }

    async getRun(id: string): Promise<TestRun> {
        return this.request<TestRun>('GET', `/testing/runs/${id}`);
    }

    async updateRun(id: string, input: UpdateTestRunInput): Promise<TestRun> {
        return this.request<TestRun>('PATCH', `/testing/runs/${id}`, input);
    }

    async submitResults(runId: string, ctrf: CtrfReport): Promise<{ count: number }> {
        return this.request<{ count: number }>('POST', `/testing/runs/${runId}/results`, ctrf);
    }

    // ── Test Cases ──

    async createCase(input: CreateTestCaseInput): Promise<TestCase> {
        return this.request<TestCase>('POST', '/testing/cases', input);
    }

    async listCases(filters?: ListTestCasesFilters): Promise<PaginatedResponse<TestCase>> {
        const qs = this.buildQueryString(filters as Record<string, string | number | undefined>);
        return this.request<PaginatedResponse<TestCase>>('GET', `/testing/cases${qs}`);
    }

    async getCase(id: string): Promise<TestCase> {
        return this.request<TestCase>('GET', `/testing/cases/${id}`);
    }

    async updateCase(id: string, input: UpdateTestCaseInput): Promise<TestCase> {
        return this.request<TestCase>('PATCH', `/testing/cases/${id}`, input);
    }

    async deleteCase(id: string): Promise<void> {
        await this.request<unknown>('DELETE', `/testing/cases/${id}`);
    }

    // ── Test Environments ──

    async createEnvironment(input: CreateTestEnvironmentInput): Promise<TestEnvironment> {
        return this.request<TestEnvironment>('POST', '/testing/environments', input);
    }

    async listEnvironments(): Promise<TestEnvironment[]> {
        return this.request<TestEnvironment[]>('GET', '/testing/environments');
    }

    async getEnvironment(id: string): Promise<TestEnvironment> {
        return this.request<TestEnvironment>('GET', `/testing/environments/${id}`);
    }

    async updateEnvironment(id: string, input: UpdateTestEnvironmentInput): Promise<TestEnvironment> {
        return this.request<TestEnvironment>('PATCH', `/testing/environments/${id}`, input);
    }

    // ── Deployments ──

    async createDeployment(input: CreateDeploymentInput): Promise<Deployment> {
        return this.request<Deployment>('POST', '/testing/deployments', input);
    }

    async listDeployments(filters?: ListDeploymentsFilters): Promise<PaginatedResponse<Deployment>> {
        const qs = this.buildQueryString(filters as Record<string, string | number | undefined>);
        return this.request<PaginatedResponse<Deployment>>('GET', `/testing/deployments${qs}`);
    }

    async getDeployment(id: string): Promise<Deployment> {
        return this.request<Deployment>('GET', `/testing/deployments/${id}`);
    }

    async updateDeployment(id: string, input: UpdateDeploymentInput): Promise<Deployment> {
        return this.request<Deployment>('PATCH', `/testing/deployments/${id}`, input);
    }

    async deleteDeployment(id: string): Promise<void> {
        await this.request<unknown>('DELETE', `/testing/deployments/${id}`);
    }

    // ── High-Level: Report ──

    /**
     * High-level method that creates a test run, submits CTRF results, and returns the updated run.
     */
    async report(
        ctrfFilePath: string,
        options?: {
            name?: string;
            environment?: string;
            deploymentId?: string;
            tool?: string;
            tags?: string[];
            buildName?: string;
            buildUrl?: string;
        },
    ): Promise<TestRun> {
        const raw = readFileSync(ctrfFilePath, 'utf-8');
        const ctrf = JSON.parse(raw) as CtrfReport;

        const run = await this.createRun({
            name: options?.name ?? ctrfFilePath,
            environment: options?.environment,
            deploymentId: options?.deploymentId,
            tool: options?.tool ?? ctrf.results.tool?.name,
            tags: options?.tags,
            buildName: options?.buildName,
            buildUrl: options?.buildUrl,
        });

        try {
            await this.submitResults(run.id, ctrf);
        } catch (err) {
            await this.updateRun(run.id, {
                status: 'errored',
                completedAt: new Date().toISOString(),
            });
            throw err;
        }

        return this.getRun(run.id);
    }
}
