/**
 * TypeScript types matching the Smoo AI Testing API schemas.
 */

// ── Test Runs ──

export interface TestRunSummary {
    total?: number;
    passed?: number;
    failed?: number;
    skipped?: number;
    pending?: number;
    other?: number;
}

export interface TestRunDeployment {
    id: string;
    name: string;
    status: string;
    source: string | null;
    externalId: string | null;
    externalUrl: string | null;
    ref: string | null;
    metadata: Record<string, unknown> | null;
}

export interface TestRun {
    id: string;
    organizationId: string;
    environmentId: string | null;
    deploymentId: string | null;
    name: string;
    tool: string | null;
    status: string;
    summary: TestRunSummary | null;
    durationMs: number | null;
    runnerName: string | null;
    runnerUrl: string | null;
    startedAt: string | null;
    completedAt: string | null;
    metadata: Record<string, unknown> | null;
    createdAt: string;
    updatedAt: string;
    deployment?: TestRunDeployment | null;
    results?: TestResult[];
}

export interface CreateTestRunInput {
    name: string;
    environment?: string;
    environmentId?: string;
    deploymentId?: string;
    tool?: string;
    buildName?: string;
    buildUrl?: string;
    runnerName?: string;
    runnerUrl?: string;
    metadata?: Record<string, unknown>;
}

export interface UpdateTestRunInput {
    status?: string;
    summary?: TestRunSummary;
    completedAt?: string;
    startedAt?: string;
    tool?: string;
    metadata?: Record<string, unknown>;
}

export interface ListTestRunsFilters {
    limit?: number;
    offset?: number;
    status?: string;
    environmentId?: string;
    tool?: string;
    runnerName?: string;
    startDate?: string;
    endDate?: string;
}

// ── Test Results ──

export interface TestResult {
    id?: string;
    name: string;
    suite?: string;
    status: string;
    durationMs?: number;
    message?: string;
    trace?: string;
    retryCount?: number;
    flaky?: boolean;
    browser?: string;
    tags?: string[];
    metadata?: Record<string, unknown>;
}

// ── Test Cases ──

export interface TestCaseStep {
    id?: string;
    stepNumber: number;
    action: string;
    expectedResult?: string;
    data?: string;
}

export interface TestCase {
    id: string;
    organizationId: string;
    title: string;
    description: string | null;
    preconditions: string | null;
    expectedResult: string | null;
    priority: string | null;
    automationStatus: string | null;
    automationId: string | null;
    tags: string[] | null;
    estimatedDurationMs: number | null;
    metadata: Record<string, unknown> | null;
    createdAt: string;
    updatedAt: string;
    steps?: TestCaseStep[];
    recentResults?: TestResult[];
}

export interface CreateTestCaseInput {
    title: string;
    description?: string;
    preconditions?: string;
    expectedResult?: string;
    priority?: string;
    automationStatus?: string;
    automationId?: string;
    tags?: string[];
    estimatedDurationMs?: number;
    metadata?: Record<string, unknown>;
    steps?: Omit<TestCaseStep, 'id'>[];
}

export interface UpdateTestCaseInput {
    title?: string;
    description?: string;
    preconditions?: string;
    expectedResult?: string;
    priority?: string;
    automationStatus?: string;
    automationId?: string;
    tags?: string[];
    estimatedDurationMs?: number;
    metadata?: Record<string, unknown>;
    steps?: TestCaseStep[];
}

export interface ListTestCasesFilters {
    limit?: number;
    offset?: number;
    tags?: string;
    priority?: string;
    automationStatus?: string;
}

// ── Test Environments ──

export interface TestEnvironment {
    id: string;
    organizationId: string;
    name: string;
    description: string | null;
    baseUrl: string | null;
    metadata: Record<string, unknown> | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateTestEnvironmentInput {
    name: string;
    description?: string;
    baseUrl?: string;
    metadata?: Record<string, unknown>;
}

export interface UpdateTestEnvironmentInput {
    name?: string;
    description?: string;
    baseUrl?: string;
    metadata?: Record<string, unknown>;
}

// ── Deployments ──

export type DeploymentStatus = 'pending' | 'in_progress' | 'success' | 'failure' | 'cancelled';

export interface Deployment {
    id: string;
    organizationId: string;
    environmentId: string | null;
    name: string;
    status: DeploymentStatus;
    source: string | null;
    externalId: string | null;
    externalUrl: string | null;
    ref: string | null;
    metadata: Record<string, unknown> | null;
    startedAt: string | null;
    completedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface CreateDeploymentInput {
    name: string;
    environmentId?: string;
    status?: DeploymentStatus;
    source?: string;
    externalId?: string;
    externalUrl?: string;
    ref?: string;
    metadata?: Record<string, unknown>;
    startedAt?: string;
}

export interface UpdateDeploymentInput {
    name?: string;
    status?: DeploymentStatus;
    source?: string;
    externalId?: string;
    externalUrl?: string;
    ref?: string;
    metadata?: Record<string, unknown>;
    startedAt?: string;
    completedAt?: string;
}

export interface ListDeploymentsFilters {
    limit?: number;
    offset?: number;
    status?: string;
    environmentId?: string;
    source?: string;
    startDate?: string;
    endDate?: string;
}

// ── Pagination ──

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        limit: number;
        offset: number;
        total: number;
        hasMore: boolean;
    };
}

// ── CTRF (Common Test Report Format) ──

export interface CtrfReport {
    results: {
        tool?: { name?: string; version?: string };
        summary?: {
            tests?: number;
            passed?: number;
            failed?: number;
            skipped?: number;
            pending?: number;
            other?: number;
            start?: number;
            stop?: number;
        };
        tests?: CtrfTest[];
        environment?: {
            reportName?: string;
            [key: string]: unknown;
        };
    };
}

export interface CtrfTest {
    name: string;
    status: 'passed' | 'failed' | 'skipped' | 'pending' | 'other';
    duration?: number;
    suite?: string;
    filePath?: string;
    message?: string;
    trace?: string;
    retries?: number;
    flaky?: boolean;
    browser?: string;
    tags?: string[];
    extra?: Record<string, unknown>;
}

// ── Auth / Credentials ──

export interface Credentials {
    clientId: string;
    clientSecret: string;
    orgId: string;
    apiUrl: string;
    authUrl: string;
}

export interface TokenResponse {
    access_token: string;
    token_type: string;
    expires_in?: number;
}

// ── Client Options ──

export interface SmooTestingClientOptions {
    clientId: string;
    clientSecret: string;
    orgId: string;
    apiUrl?: string;
    authUrl?: string;
}
