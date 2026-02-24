import type { Deployment, PaginatedResponse } from '../../../lib/types';
import { ApiClient } from '../../utils/api-client';
import { getCredentialsOrExit } from '../../utils/credentials';
import { errorOutput, isInteractive, jsonOutput } from '../../utils/output';

interface ListOptions {
    json?: boolean;
    status?: string;
    environmentId?: string;
    source?: string;
    limit?: string;
    offset?: string;
}

export async function runList(options: ListOptions): Promise<void> {
    try {
        const creds = getCredentialsOrExit();
        const client = new ApiClient(creds);

        const result = await client.get<PaginatedResponse<Deployment>>('/testing/deployments', {
            status: options.status,
            environmentId: options.environmentId,
            source: options.source,
            limit: options.limit,
            offset: options.offset,
        });

        if (!isInteractive(options.json)) {
            jsonOutput(result);
        }

        console.log(`Deployments (${result.data.length} of ${result.pagination.total}):\n`);
        for (const d of result.data) {
            const ref = d.ref ? ` (${d.ref})` : '';
            console.log(`  ${d.id}  ${d.status.padEnd(12)}  ${d.name}${ref}`);
        }

        if (result.pagination.hasMore) {
            console.log(`\n  ... ${result.pagination.total - result.data.length} more. Use --offset to paginate.`);
        }
    } catch (err) {
        errorOutput(err instanceof Error ? err.message : String(err));
    }
}
