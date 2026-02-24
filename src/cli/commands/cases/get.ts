import type { TestCase } from '../../../lib/types';
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

        const tc = await client.get<TestCase>(`/testing/cases/${id}`);

        if (!isInteractive(options.json)) {
            jsonOutput(tc);
        }

        console.log(`Test Case: ${tc.id}`);
        console.log(`  Title:       ${tc.title}`);
        console.log(`  Priority:    ${tc.priority ?? 'N/A'}`);
        console.log(`  Automation:  ${tc.automationStatus ?? 'N/A'}`);
        if (tc.description) console.log(`  Description: ${tc.description}`);
        if (tc.tags?.length) console.log(`  Tags:        ${tc.tags.join(', ')}`);
        console.log(`  Created:     ${tc.createdAt}`);
    } catch (err) {
        errorOutput(err instanceof Error ? err.message : String(err));
    }
}
