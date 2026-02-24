import type { TestEnvironment } from '../../../lib/types';
import { ApiClient } from '../../utils/api-client';
import { getCredentialsOrExit } from '../../utils/credentials';
import { errorOutput, isInteractive, jsonOutput } from '../../utils/output';

interface ListOptions {
    json?: boolean;
}

export async function runList(options: ListOptions): Promise<void> {
    try {
        const creds = getCredentialsOrExit();
        const client = new ApiClient(creds);

        const envs = await client.get<TestEnvironment[]>('/testing/environments');

        if (!isInteractive(options.json)) {
            jsonOutput(envs);
        }

        console.log(`Test Environments (${envs.length}):\n`);
        for (const env of envs) {
            const url = env.baseUrl ? ` (${env.baseUrl})` : '';
            console.log(`  ${env.id}  ${env.name}${url}`);
        }
    } catch (err) {
        errorOutput(err instanceof Error ? err.message : String(err));
    }
}
