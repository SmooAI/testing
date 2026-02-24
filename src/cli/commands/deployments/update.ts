import type { Deployment } from '../../../lib/types';
import { ApiClient } from '../../utils/api-client';
import { getCredentialsOrExit } from '../../utils/credentials';
import { errorOutput, isInteractive, jsonOutput } from '../../utils/output';

interface UpdateOptions {
    json?: boolean;
    name?: string;
    status?: string;
    externalUrl?: string;
}

export async function runUpdate(id: string, options: UpdateOptions): Promise<void> {
    try {
        const creds = getCredentialsOrExit();
        const client = new ApiClient(creds);

        const body: Record<string, unknown> = {};
        if (options.name) body.name = options.name;
        if (options.status) body.status = options.status;
        if (options.externalUrl) body.externalUrl = options.externalUrl;

        const deployment = await client.patch<Deployment>(`/testing/deployments/${id}`, body);

        if (!isInteractive(options.json)) {
            jsonOutput(deployment);
        }

        console.log(`Updated deployment: ${deployment.id}`);
        console.log(`  Status: ${deployment.status}`);
    } catch (err) {
        errorOutput(err instanceof Error ? err.message : String(err));
    }
}
