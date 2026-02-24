import type { Deployment } from '../../../lib/types';
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

        const deployment = await client.get<Deployment>(`/testing/deployments/${id}`);

        if (!isInteractive(options.json)) {
            jsonOutput(deployment);
        }

        console.log(`Deployment: ${deployment.id}`);
        console.log(`  Name:         ${deployment.name}`);
        console.log(`  Status:       ${deployment.status}`);
        console.log(`  Source:       ${deployment.source ?? 'N/A'}`);
        console.log(`  Ref:          ${deployment.ref ?? 'N/A'}`);
        console.log(`  External URL: ${deployment.externalUrl ?? 'N/A'}`);
        console.log(`  Created:      ${deployment.createdAt}`);
        if (deployment.completedAt) {
            console.log(`  Completed:    ${deployment.completedAt}`);
        }
    } catch (err) {
        errorOutput(err instanceof Error ? err.message : String(err));
    }
}
