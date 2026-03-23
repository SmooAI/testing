import { basename } from 'path';
import { render, Box, Text } from 'ink';
import React, { useEffect, useState } from 'react';
import type { TestRun, CtrfReport } from '../../../lib/types';
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
    tags?: string;
    buildName?: string;
    buildUrl?: string;
    additionalOrgIds?: string;
}

/** Build the run body from options and parsed CTRF report */
function buildRunBody(ctrfFile: string, report: CtrfReport, options: ReportOptions): Record<string, unknown> {
    const runName = options.name ?? basename(ctrfFile, '.json');
    const runBody: Record<string, unknown> = {
        name: runName,
        tool: options.tool ?? report.results.tool?.name,
        buildName: options.buildName ?? process.env.GITHUB_SHA,
    };

    if (options.environment) runBody.environment = options.environment;
    if (options.deploymentId) runBody.deploymentId = options.deploymentId;
    if (options.tags) runBody.tags = options.tags.split(',').map((t: string) => t.trim());

    if (options.buildUrl) {
        runBody.buildUrl = options.buildUrl;
    } else if (process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID) {
        runBody.buildUrl = `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`;
    }

    return runBody;
}

/** Create a test run and submit CTRF results using the given API client */
async function submitReportToOrg(client: ApiClient, report: CtrfReport, runBody: Record<string, unknown>): Promise<{ run: TestRun; resultCount: number }> {
    const run = await client.post<TestRun>('/testing/runs', runBody);

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

    const updatedRun = await client.get<TestRun>(`/testing/runs/${run.id}`);
    return { run: updatedRun, resultCount };
}

/** Parse additional org IDs from comma-separated string */
function parseAdditionalOrgIds(raw?: string): string[] {
    if (!raw) return [];
    return raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
}

export async function reportLogic(
    ctrfFile: string,
    options: ReportOptions,
): Promise<{
    run: TestRun;
    resultCount: number;
    summary: ReturnType<typeof summarizeCtrfResults>;
    additionalResults: Array<{ orgId: string; run: TestRun; resultCount: number } | { orgId: string; error: string }>;
}> {
    // 1. Parse CTRF file
    const report = parseCtrfFile(ctrfFile);
    const summary = summarizeCtrfResults(report);

    // 2. Authenticate
    const creds = getCredentialsOrExit();
    const client = new ApiClient(creds);

    // 3. Build run body
    const runBody = buildRunBody(ctrfFile, report, options);

    // 4. Submit to primary org
    const { run, resultCount } = await submitReportToOrg(client, report, runBody);

    // 5. Submit to additional orgs
    const additionalOrgIds = parseAdditionalOrgIds(options.additionalOrgIds);
    const additionalResults: Array<{ orgId: string; run: TestRun; resultCount: number } | { orgId: string; error: string }> = [];

    for (const orgId of additionalOrgIds) {
        try {
            const altClient = client.withOrgId(orgId);
            const result = await submitReportToOrg(altClient, report, runBody);
            additionalResults.push({ orgId, run: result.run, resultCount: result.resultCount });
        } catch (err) {
            additionalResults.push({ orgId, error: err instanceof Error ? err.message : String(err) });
        }
    }

    return { run, resultCount, summary, additionalResults };
}

function ReportUI({ ctrfFile, options }: { ctrfFile: string; options: ReportOptions }) {
    const additionalOrgIds = parseAdditionalOrgIds(options.additionalOrgIds);
    const additionalOrgTasks: TaskItem[] = additionalOrgIds.map((orgId) => ({
        label: `Pushing results to org ${orgId}`,
        status: 'pending' as const,
    }));

    const [tasks, setTasks] = useState<TaskItem[]>([
        { label: 'Parsing CTRF report', status: 'pending' },
        { label: 'Authenticating', status: 'pending' },
        { label: 'Creating test run', status: 'pending' },
        { label: 'Submitting results', status: 'pending' },
        ...additionalOrgTasks,
    ]);
    const [result, setResult] = useState<Awaited<ReturnType<typeof reportLogic>> | null>(null);

    // Index where additional org tasks start
    const additionalStartIndex = 4;

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

                // Build run body
                const runBody = buildRunBody(ctrfFile, report, options);

                // Create run
                setTasks((t) => t.map((task, i) => (i === 2 ? { ...task, status: 'running' } : task)));
                const run = await client.post<TestRun>('/testing/runs', runBody);
                setTasks((t) => t.map((task, i) => (i === 2 ? { ...task, status: 'done' } : task)));

                // Submit results
                setTasks((t) => t.map((task, i) => (i === 3 ? { ...task, status: 'running' } : task)));
                const resultResponse = await client.post<{ count: number }>(`/testing/runs/${run.id}/results`, {
                    results: report.results,
                });
                setTasks((t) => t.map((task, i) => (i === 3 ? { ...task, status: 'done' } : task)));

                const updatedRun = await client.get<TestRun>(`/testing/runs/${run.id}`);

                // Submit to additional orgs
                const additionalResults: Array<{ orgId: string; run: TestRun; resultCount: number } | { orgId: string; error: string }> = [];

                for (let idx = 0; idx < additionalOrgIds.length; idx++) {
                    const orgId = additionalOrgIds[idx];
                    const taskIdx = additionalStartIndex + idx;
                    setTasks((t) => t.map((task, i) => (i === taskIdx ? { ...task, status: 'running' } : task)));

                    try {
                        const altClient = client.withOrgId(orgId);
                        const altResult = await submitReportToOrg(altClient, report, runBody);
                        additionalResults.push({ orgId, run: altResult.run, resultCount: altResult.resultCount });
                        setTasks((t) => t.map((task, i) => (i === taskIdx ? { ...task, status: 'done' } : task)));
                    } catch (err) {
                        const errorMsg = err instanceof Error ? err.message : String(err);
                        additionalResults.push({ orgId, error: errorMsg });
                        setTasks((t) => t.map((task, i) => (i === taskIdx ? { ...task, status: 'error', error: errorMsg } : task)));
                    }
                }

                setResult({ run: updatedRun, resultCount: resultResponse.count, summary, additionalResults });
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
                    {result.additionalResults.length > 0 && (
                        <Box marginTop={1} flexDirection="column">
                            <Text bold>Additional orgs:</Text>
                            {result.additionalResults.map((ar) =>
                                'error' in ar ? (
                                    <Text key={ar.orgId} color="red">
                                        {' '}
                                        ✗ {ar.orgId}: {ar.error}
                                    </Text>
                                ) : (
                                    <Text key={ar.orgId} color="green">
                                        {' '}
                                        ✓ {ar.orgId}: Run {ar.run.id} — {ar.resultCount} results
                                    </Text>
                                ),
                            )}
                        </Box>
                    )}
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
                    additionalResults: result.additionalResults.map((ar) =>
                        'error' in ar
                            ? { orgId: ar.orgId, success: false, error: ar.error }
                            : { orgId: ar.orgId, success: true, runId: ar.run.id, resultCount: ar.resultCount },
                    ),
                }),
            (err) => {
                errorOutput(err instanceof Error ? err.message : String(err));
            },
        );
        return;
    }
    render(<ReportUI ctrfFile={ctrfFile} options={options} />);
}
