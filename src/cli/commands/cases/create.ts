import type { TestCase } from '../../../lib/types';
import { ApiClient } from '../../utils/api-client';
import { getCredentialsOrExit } from '../../utils/credentials';
import { errorOutput, isInteractive, jsonOutput } from '../../utils/output';

interface CreateOptions {
    json?: boolean;
    title: string;
    description?: string;
    priority?: string;
    automationStatus?: string;
    tags?: string;
}

export async function runCreate(options: CreateOptions): Promise<void> {
    try {
        const creds = getCredentialsOrExit();
        const client = new ApiClient(creds);

        const body: Record<string, unknown> = { title: options.title };
        if (options.description) body.description = options.description;
        if (options.priority) body.priority = options.priority;
        if (options.automationStatus) body.automationStatus = options.automationStatus;
        if (options.tags) body.tags = options.tags.split(',').map((t) => t.trim());

        const tc = await client.post<TestCase>('/testing/cases', body);

        if (!isInteractive(options.json)) {
            jsonOutput(tc);
        }

        console.log(`Created test case: ${tc.id}`);
        console.log(`  Title:    ${tc.title}`);
        console.log(`  Priority: ${tc.priority ?? 'N/A'}`);
    } catch (err) {
        errorOutput(err instanceof Error ? err.message : String(err));
    }
}
