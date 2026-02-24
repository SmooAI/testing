import { ApiClient } from '../../utils/api-client';
import { getCredentialsOrExit } from '../../utils/credentials';
import { errorOutput, isInteractive, jsonOutput } from '../../utils/output';

interface DeleteOptions {
    json?: boolean;
}

export async function runDelete(id: string, options: DeleteOptions): Promise<void> {
    try {
        const creds = getCredentialsOrExit();
        const client = new ApiClient(creds);

        await client.delete(`/testing/cases/${id}`);

        if (!isInteractive(options.json)) {
            jsonOutput({ success: true, id });
        }

        console.log(`Deleted test case: ${id}`);
    } catch (err) {
        errorOutput(err instanceof Error ? err.message : String(err));
    }
}
