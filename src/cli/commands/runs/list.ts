import type { PaginatedResponse, TestRun } from '../../../lib/types';
import { ApiClient } from '../../utils/api-client';
import { getCredentialsOrExit } from '../../utils/credentials';
import { errorOutput, isInteractive, jsonOutput } from '../../utils/output';

interface ListOptions {
    json?: boolean;
    status?: string;
    environmentId?: string;
    tool?: string;
    tags?: string;
    limit?: string;
    offset?: string;
}

export async function runList(options: ListOptions): Promise<void> {
    try {
        const creds = getCredentialsOrExit();
        const client = new ApiClient(creds);

        const result = await client.get<PaginatedResponse<TestRun>>('/testing/runs', {
            status: options.status,
            environmentId: options.environmentId,
            tool: options.tool,
            tags: options.tags,
            limit: options.limit,
            offset: options.offset,
        });

        if (!isInteractive(options.json)) {
            jsonOutput(result);
        }

        console.log(`Test Runs (${result.data.length} of ${result.pagination.total}):\n`);
        for (const run of result.data) {
            const summary = run.summary ? ` [${run.summary.passed ?? 0}P/${run.summary.failed ?? 0}F/${run.summary.skipped ?? 0}S]` : '';
            console.log(`  ${run.id}  ${run.status.padEnd(8)}  ${run.name}${summary}`);
        }

        if (result.pagination.hasMore) {
            console.log(`\n  ... ${result.pagination.total - result.data.length} more. Use --offset to paginate.`);
        }
    } catch (err) {
        errorOutput(err instanceof Error ? err.message : String(err));
    }
}
