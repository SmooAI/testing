import type { TestRun } from '../../../lib/types';
import { ApiClient } from '../../utils/api-client';
import { getCredentialsOrExit } from '../../utils/credentials';
import { errorOutput, isInteractive, jsonOutput } from '../../utils/output';

interface CreateOptions {
    json?: boolean;
    name: string;
    environment?: string;
    environmentId?: string;
    deploymentId?: string;
    tool?: string;
    tags?: string;
    runnerName?: string;
    runnerUrl?: string;
}

export async function runCreate(options: CreateOptions): Promise<void> {
    try {
        const creds = getCredentialsOrExit();
        const client = new ApiClient(creds);

        const body: Record<string, unknown> = { name: options.name };
        if (options.environment) body.environment = options.environment;
        if (options.environmentId) body.environmentId = options.environmentId;
        if (options.deploymentId) body.deploymentId = options.deploymentId;
        if (options.tool) body.tool = options.tool;
        if (options.tags) body.tags = options.tags.split(',').map((t: string) => t.trim());
        if (options.runnerName) body.runnerName = options.runnerName;
        if (options.runnerUrl) body.runnerUrl = options.runnerUrl;

        const run = await client.post<TestRun>('/testing/runs', body);

        if (!isInteractive(options.json)) {
            jsonOutput(run);
        }

        console.log(`Created test run: ${run.id}`);
        console.log(`  Name:   ${run.name}`);
        console.log(`  Status: ${run.status}`);
    } catch (err) {
        errorOutput(err instanceof Error ? err.message : String(err));
    }
}
