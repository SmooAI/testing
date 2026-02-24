import type { TestRun } from '../../../lib/types';
import { ApiClient } from '../../utils/api-client';
import { getCredentialsOrExit } from '../../utils/credentials';
import { errorOutput, isInteractive, jsonOutput } from '../../utils/output';

interface UpdateOptions {
    json?: boolean;
    status?: string;
}

export async function runUpdate(id: string, options: UpdateOptions): Promise<void> {
    try {
        const creds = getCredentialsOrExit();
        const client = new ApiClient(creds);

        const body: Record<string, unknown> = {};
        if (options.status) body.status = options.status;

        const run = await client.patch<TestRun>(`/testing/runs/${id}`, body);

        if (!isInteractive(options.json)) {
            jsonOutput(run);
        }

        console.log(`Updated test run: ${run.id}`);
        console.log(`  Status: ${run.status}`);
    } catch (err) {
        errorOutput(err instanceof Error ? err.message : String(err));
    }
}
