import type { PaginatedResponse, TestCase } from '../../../lib/types';
import { ApiClient } from '../../utils/api-client';
import { getCredentialsOrExit } from '../../utils/credentials';
import { errorOutput, isInteractive, jsonOutput } from '../../utils/output';

interface ListOptions {
    json?: boolean;
    tags?: string;
    priority?: string;
    automationStatus?: string;
    limit?: string;
    offset?: string;
}

export async function runList(options: ListOptions): Promise<void> {
    try {
        const creds = getCredentialsOrExit();
        const client = new ApiClient(creds);

        const result = await client.get<PaginatedResponse<TestCase>>('/testing/cases', {
            tags: options.tags,
            priority: options.priority,
            automationStatus: options.automationStatus,
            limit: options.limit,
            offset: options.offset,
        });

        if (!isInteractive(options.json)) {
            jsonOutput(result);
        }

        console.log(`Test Cases (${result.data.length} of ${result.pagination.total}):\n`);
        for (const tc of result.data) {
            const tags = tc.tags?.length ? ` [${tc.tags.join(', ')}]` : '';
            console.log(`  ${tc.id}  ${(tc.priority ?? '-').padEnd(8)}  ${tc.title}${tags}`);
        }

        if (result.pagination.hasMore) {
            console.log(`\n  ... ${result.pagination.total - result.data.length} more. Use --offset to paginate.`);
        }
    } catch (err) {
        errorOutput(err instanceof Error ? err.message : String(err));
    }
}
