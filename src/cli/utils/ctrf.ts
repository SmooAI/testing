/**
 * CTRF (Common Test Report Format) file parsing and validation.
 */

import { readFileSync } from 'fs';
import { z } from 'zod';
import type { CtrfReport } from '../../lib/types';

const CtrfTestSchema = z.object({
    name: z.string(),
    status: z.enum(['passed', 'failed', 'skipped', 'pending', 'other']),
    duration: z.number().optional(),
    suite: z.string().optional(),
    filePath: z.string().optional(),
    message: z.string().optional(),
    trace: z.string().optional(),
    retries: z.number().optional(),
    flaky: z.boolean().optional(),
    browser: z.string().optional(),
    tags: z.array(z.string()).optional(),
    extra: z.record(z.string(), z.unknown()).optional(),
});

const CtrfReportSchema = z.object({
    results: z.object({
        tool: z
            .object({
                name: z.string().optional(),
                version: z.string().optional(),
            })
            .optional(),
        summary: z
            .object({
                tests: z.number().optional(),
                passed: z.number().optional(),
                failed: z.number().optional(),
                skipped: z.number().optional(),
                pending: z.number().optional(),
                other: z.number().optional(),
                start: z.number().optional(),
                stop: z.number().optional(),
            })
            .optional(),
        tests: z.array(CtrfTestSchema).optional(),
        environment: z.record(z.string(), z.unknown()).optional(),
    }),
});

export function parseCtrfFile(filePath: string): CtrfReport {
    let raw: string;
    try {
        raw = readFileSync(filePath, 'utf-8');
    } catch (err) {
        throw new Error(`Failed to read CTRF file: ${filePath} — ${err instanceof Error ? err.message : String(err)}`);
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        throw new Error(`Invalid JSON in CTRF file: ${filePath}`);
    }

    const result = CtrfReportSchema.safeParse(parsed);
    if (!result.success) {
        const issues = result.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
        throw new Error(`Invalid CTRF format:\n${issues}`);
    }

    return result.data as CtrfReport;
}

export function summarizeCtrfResults(report: CtrfReport): {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    pending: number;
    other: number;
    hasFailed: boolean;
} {
    const summary = report.results.summary;
    if (summary) {
        const total = summary.tests ?? 0;
        const passed = summary.passed ?? 0;
        const failed = summary.failed ?? 0;
        const skipped = summary.skipped ?? 0;
        const pending = summary.pending ?? 0;
        const other = summary.other ?? 0;
        return { total, passed, failed, skipped, pending, other, hasFailed: failed > 0 };
    }

    // Derive from tests array if no summary
    const tests = report.results.tests ?? [];
    const counts = { total: tests.length, passed: 0, failed: 0, skipped: 0, pending: 0, other: 0 };
    for (const test of tests) {
        if (test.status in counts) {
            counts[test.status as keyof Omit<typeof counts, 'total'>]++;
        }
    }
    return { ...counts, hasFailed: counts.failed > 0 };
}
