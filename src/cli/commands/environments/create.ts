import type { TestEnvironment } from '../../../lib/types';
import { ApiClient } from '../../utils/api-client';
import { getCredentialsOrExit } from '../../utils/credentials';
import { errorOutput, isInteractive, jsonOutput } from '../../utils/output';

interface CreateOptions {
    json?: boolean;
    name: string;
    description?: string;
    baseUrl?: string;
}

export async function runCreate(options: CreateOptions): Promise<void> {
    try {
        const creds = getCredentialsOrExit();
        const client = new ApiClient(creds);

        const body: Record<string, unknown> = { name: options.name };
        if (options.description) body.description = options.description;
        if (options.baseUrl) body.baseUrl = options.baseUrl;

        const env = await client.post<TestEnvironment>('/testing/environments', body);

        if (!isInteractive(options.json)) {
            jsonOutput(env);
        }

        console.log(`Created environment: ${env.id}`);
        console.log(`  Name: ${env.name}`);
    } catch (err) {
        errorOutput(err instanceof Error ? err.message : String(err));
    }
}
