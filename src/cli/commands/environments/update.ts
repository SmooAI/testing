import type { TestEnvironment } from '../../../lib/types';
import { ApiClient } from '../../utils/api-client';
import { getCredentialsOrExit } from '../../utils/credentials';
import { errorOutput, isInteractive, jsonOutput } from '../../utils/output';

interface UpdateOptions {
    json?: boolean;
    name?: string;
    description?: string;
    baseUrl?: string;
}

export async function runUpdate(id: string, options: UpdateOptions): Promise<void> {
    try {
        const creds = getCredentialsOrExit();
        const client = new ApiClient(creds);

        const body: Record<string, unknown> = {};
        if (options.name) body.name = options.name;
        if (options.description) body.description = options.description;
        if (options.baseUrl) body.baseUrl = options.baseUrl;

        const env = await client.patch<TestEnvironment>(`/testing/environments/${id}`, body);

        if (!isInteractive(options.json)) {
            jsonOutput(env);
        }

        console.log(`Updated environment: ${env.id}`);
        console.log(`  Name: ${env.name}`);
    } catch (err) {
        errorOutput(err instanceof Error ? err.message : String(err));
    }
}
