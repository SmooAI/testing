import { render, Box, Text } from 'ink';
import React, { useEffect, useState } from 'react';
import type { Credentials } from '../../../lib/types';
import { Banner } from '../../components/Banner';
import { TaskList, type TaskItem } from '../../components/TaskList';
import { ApiClient } from '../../utils/api-client';
import { saveCredentials } from '../../utils/credentials';
import { isInteractive, jsonOutput } from '../../utils/output';

interface LoginOptions {
    json?: boolean;
    clientId?: string;
    clientSecret?: string;
    orgId?: string;
    apiUrl?: string;
    authUrl?: string;
}

const DEFAULT_API_URL = 'https://api.production.smoo.ai';
const DEFAULT_AUTH_URL = 'https://auth.production.smoo.ai/token';

export async function loginLogic(options: LoginOptions): Promise<{ success: boolean; orgId: string }> {
    const clientId = options.clientId;
    const clientSecret = options.clientSecret;
    const orgId = options.orgId;
    const apiUrl = options.apiUrl ?? DEFAULT_API_URL;
    const authUrl = options.authUrl ?? DEFAULT_AUTH_URL;

    if (!clientId) throw new Error('Client ID is required. Use --client-id flag.');
    if (!clientSecret) throw new Error('Client secret is required. Use --client-secret flag.');
    if (!orgId) throw new Error('Organization ID is required. Use --org-id flag.');

    const credentials: Credentials = { clientId, clientSecret, orgId, apiUrl, authUrl };

    // Validate by making a test API call
    const client = new ApiClient(credentials);
    await client.get<unknown[]>('/testing/environments');

    // Save credentials
    saveCredentials(credentials);

    return { success: true, orgId };
}

function LoginUI({ options }: { options: LoginOptions }) {
    const [tasks, setTasks] = useState<TaskItem[]>([
        { label: 'Validating credentials', status: 'pending' },
        { label: 'Saving to ~/.smooai/credentials.json', status: 'pending' },
    ]);
    const [result, setResult] = useState<{ orgId: string } | null>(null);

    useEffect(() => {
        (async () => {
            setTasks((t) => t.map((task, i) => (i === 0 ? { ...task, status: 'running' } : task)));

            try {
                const res = await loginLogic(options);

                setTasks([
                    { label: 'Validating credentials', status: 'done' },
                    { label: 'Saving to ~/.smooai/credentials.json', status: 'done' },
                ]);
                setResult({ orgId: res.orgId });
            } catch (err) {
                setTasks((t) =>
                    t.map((task) => (task.status === 'running' ? { ...task, status: 'error', error: err instanceof Error ? err.message : String(err) } : task)),
                );
            }
        })();
    }, []);

    return (
        <Box flexDirection="column">
            <Banner title="Login" />
            <TaskList tasks={tasks} />
            {result && (
                <Box marginTop={1}>
                    <Text color="green" bold>
                        Logged in successfully! Organization: {result.orgId}
                    </Text>
                </Box>
            )}
        </Box>
    );
}

export function runLogin(options: LoginOptions): void {
    if (!isInteractive(options.json)) {
        loginLogic(options).then(
            (result) => jsonOutput(result),
            (err) => jsonOutput({ success: false, error: err.message }, 1),
        );
        return;
    }
    render(<LoginUI options={options} />);
}
