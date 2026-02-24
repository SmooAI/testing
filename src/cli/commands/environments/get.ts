import type { TestEnvironment } from '../../../lib/types';
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

        const env = await client.get<TestEnvironment>(`/testing/environments/${id}`);

        if (!isInteractive(options.json)) {
            jsonOutput(env);
        }

        console.log(`Environment: ${env.id}`);
        console.log(`  Name:        ${env.name}`);
        console.log(`  Description: ${env.description ?? 'N/A'}`);
        console.log(`  Base URL:    ${env.baseUrl ?? 'N/A'}`);
        console.log(`  Created:     ${env.createdAt}`);
    } catch (err) {
        errorOutput(err instanceof Error ? err.message : String(err));
    }
}
