import { basename } from 'path';
import { render, Box, Text } from 'ink';
import React, { useEffect, useState } from 'react';
import type { TestRun } from '../../../lib/types';
import { Banner } from '../../components/Banner';
import { TaskList, type TaskItem } from '../../components/TaskList';
import { ApiClient } from '../../utils/api-client';
import { getCredentialsOrExit } from '../../utils/credentials';
import { parseCtrfFile, summarizeCtrfResults } from '../../utils/ctrf';
import { isInteractive, jsonOutput, errorOutput } from '../../utils/output';

interface ReportOptions {
    json?: boolean;
    name?: string;
    environment?: string;
    deploymentId?: string;
    tool?: string;
    buildName?: string;
    buildUrl?: string;
}

export async function reportLogic(
    ctrfFile: string,
    options: ReportOptions,
): Promise<{
    run: TestRun;
    resultCount: number;
    summary: ReturnType<typeof summarizeCtrfResults>;
}> {
    // 1. Parse CTRF file
    const report = parseCtrfFile(ctrfFile);
    const summary = summarizeCtrfResults(report);

    // 2. Authenticate
    const creds = getCredentialsOrExit();
    const client = new ApiClient(creds);

    // 3. Create test run
    const runName = options.name ?? basename(ctrfFile, '.json');
    const runBody: Record<string, unknown> = {
        name: runName,
        tool: options.tool ?? report.results.tool?.name,
        buildName: options.buildName ?? process.env.GITHUB_SHA,
    };

    if (options.environment) runBody.environment = options.environment;
    if (options.deploymentId) runBody.deploymentId = options.deploymentId;

    // Build URL from GitHub Actions context
    if (options.buildUrl) {
        runBody.buildUrl = options.buildUrl;
    } else if (process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID) {
        runBody.buildUrl = `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`;
    }

    const run = await client.post<TestRun>('/testing/runs', runBody);

    // 4. Submit CTRF results
    let resultCount = 0;
    try {
        const resultResponse = await client.post<{ count: number }>(`/testing/runs/${run.id}/results`, {
            results: report.results,
        });
        resultCount = resultResponse.count;
    } catch (err) {
        // Mark run as errored if result submission fails
        await client.patch(`/testing/runs/${run.id}`, {
            status: 'errored',
            completedAt: new Date().toISOString(),
        });
        throw err;
    }

    // 5. Run status is automatically updated by the results endpoint
    // Fetch the updated run
    const updatedRun = await client.get<TestRun>(`/testing/runs/${run.id}`);

    return { run: updatedRun, resultCount, summary };
}

function ReportUI({ ctrfFile, options }: { ctrfFile: string; options: ReportOptions }) {
    const [tasks, setTasks] = useState<TaskItem[]>([
        { label: 'Parsing CTRF report', status: 'pending' },
        { label: 'Authenticating', status: 'pending' },
        { label: 'Creating test run', status: 'pending' },
        { label: 'Submitting results', status: 'pending' },
    ]);
    const [result, setResult] = useState<Awaited<ReturnType<typeof reportLogic>> | null>(null);

    useEffect(() => {
        (async () => {
            try {
                // Parse
                setTasks((t) => t.map((task, i) => (i === 0 ? { ...task, status: 'running' } : task)));
                const report = parseCtrfFile(ctrfFile);
                const summary = summarizeCtrfResults(report);
                setTasks((t) => t.map((task, i) => (i === 0 ? { ...task, status: 'done' } : task)));

                // Auth
                setTasks((t) => t.map((task, i) => (i === 1 ? { ...task, status: 'running' } : task)));
                const creds = getCredentialsOrExit();
                const client = new ApiClient(creds);
                setTasks((t) => t.map((task, i) => (i === 1 ? { ...task, status: 'done' } : task)));

                // Create run
                setTasks((t) => t.map((task, i) => (i === 2 ? { ...task, status: 'running' } : task)));
                const runName = options.name ?? basename(ctrfFile, '.json');
                const runBody: Record<string, unknown> = {
                    name: runName,
                    tool: options.tool ?? report.results.tool?.name,
                    buildName: options.buildName ?? process.env.GITHUB_SHA,
                };
                if (options.environment) runBody.environment = options.environment;
                if (options.deploymentId) runBody.deploymentId = options.deploymentId;
                if (options.buildUrl) {
                    runBody.buildUrl = options.buildUrl;
                } else if (process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID) {
                    runBody.buildUrl = `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`;
                }
                const run = await client.post<TestRun>('/testing/runs', runBody);
                setTasks((t) => t.map((task, i) => (i === 2 ? { ...task, status: 'done' } : task)));

                // Submit results
                setTasks((t) => t.map((task, i) => (i === 3 ? { ...task, status: 'running' } : task)));
                const resultResponse = await client.post<{ count: number }>(`/testing/runs/${run.id}/results`, {
                    results: report.results,
                });
                setTasks((t) => t.map((task, i) => (i === 3 ? { ...task, status: 'done' } : task)));

                const updatedRun = await client.get<TestRun>(`/testing/runs/${run.id}`);
                setResult({ run: updatedRun, resultCount: resultResponse.count, summary });
            } catch (err) {
                setTasks((t) =>
                    t.map((task) => (task.status === 'running' ? { ...task, status: 'error', error: err instanceof Error ? err.message : String(err) } : task)),
                );
            }
        })();
    }, []);

    return (
        <Box flexDirection="column">
            <Banner title="Report Test Results" />
            <TaskList tasks={tasks} />
            {result && (
                <Box marginTop={1} flexDirection="column">
                    <Text color={result.summary.hasFailed ? 'red' : 'green'} bold>
                        {result.summary.hasFailed ? '✗ FAILED' : '✓ PASSED'} — {result.resultCount} results submitted
                    </Text>
                    <Text>
                        {result.summary.passed} passed, {result.summary.failed} failed, {result.summary.skipped} skipped
                    </Text>
                    <Text dimColor>Run ID: {result.run.id}</Text>
                </Box>
            )}
        </Box>
    );
}

export function runReport(ctrfFile: string, options: ReportOptions): void {
    if (!isInteractive(options.json)) {
        reportLogic(ctrfFile, options).then(
            (result) =>
                jsonOutput({
                    success: true,
                    runId: result.run.id,
                    status: result.run.status,
                    resultCount: result.resultCount,
                    summary: result.summary,
                }),
            (err) => {
                errorOutput(err instanceof Error ? err.message : String(err));
            },
        );
        return;
    }
    render(<ReportUI ctrfFile={ctrfFile} options={options} />);
}
