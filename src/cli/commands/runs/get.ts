import type { TestRun } from '../../../lib/types';
import { ApiClient } from '../../utils/api-client';
import { getCredentialsOrExit } from '../../utils/credentials';
import { errorOutput, isInteractive, jsonOutput } from '../../utils/output';

interface GetOptions {
    json?: boolean;
}

export async function runGet(id: string, options: GetOptions): Promise<void> {
    try {
        const creds = getCredentialsOrExit();
        const client = new ApiClient(creds);

        const run = await client.get<TestRun>(`/testing/runs/${id}`);

        if (!isInteractive(options.json)) {
            jsonOutput(run);
        }

        console.log(`Test Run: ${run.id}`);
        console.log(`  Name:        ${run.name}`);
        console.log(`  Status:      ${run.status}`);
        console.log(`  Tool:        ${run.tool ?? 'N/A'}`);
        if (run.summary) {
            console.log(`  Summary:     ${run.summary.passed ?? 0} passed, ${run.summary.failed ?? 0} failed, ${run.summary.skipped ?? 0} skipped`);
        }
        if (run.durationMs) {
            console.log(`  Duration:    ${(run.durationMs / 1000).toFixed(1)}s`);
        }
        console.log(`  Created:     ${run.createdAt}`);
        if (run.completedAt) {
            console.log(`  Completed:   ${run.completedAt}`);
        }
        if (run.results && run.results.length > 0) {
            console.log(`  Results:     ${run.results.length} test(s)`);
        }
    } catch (err) {
        errorOutput(err instanceof Error ? err.message : String(err));
    }
}
