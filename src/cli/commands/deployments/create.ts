import type { Deployment } from '../../../lib/types';
import { ApiClient } from '../../utils/api-client';
import { getCredentialsOrExit } from '../../utils/credentials';
import { errorOutput, isInteractive, jsonOutput } from '../../utils/output';

interface CreateOptions {
    json?: boolean;
    name: string;
    environmentId?: string;
    status?: string;
    source?: string;
    externalId?: string;
    externalUrl?: string;
    ref?: string;
}

export async function runCreate(options: CreateOptions): Promise<void> {
    try {
        const creds = getCredentialsOrExit();
        const client = new ApiClient(creds);

        const body: Record<string, unknown> = { name: options.name };
        if (options.environmentId) body.environmentId = options.environmentId;
        if (options.status) body.status = options.status;
        if (options.source) body.source = options.source;
        if (options.externalId) body.externalId = options.externalId;
        if (options.externalUrl) body.externalUrl = options.externalUrl;
        if (options.ref) body.ref = options.ref;

        const deployment = await client.post<Deployment>('/testing/deployments', body);

        if (!isInteractive(options.json)) {
            jsonOutput(deployment);
        }

        console.log(`Created deployment: ${deployment.id}`);
        console.log(`  Name:   ${deployment.name}`);
        console.log(`  Status: ${deployment.status}`);
    } catch (err) {
        errorOutput(err instanceof Error ? err.message : String(err));
    }
}
