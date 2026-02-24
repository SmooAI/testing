import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { describe, expect, it, beforeEach, afterEach } from 'vitest';
import { parseCtrfFile, summarizeCtrfResults } from '../src/cli/utils/ctrf';

const TMP_DIR = join(__dirname, '__tmp__');

beforeEach(() => {
    mkdirSync(TMP_DIR, { recursive: true });
});

afterEach(() => {
    rmSync(TMP_DIR, { recursive: true, force: true });
});

function writeTmpFile(name: string, content: unknown): string {
    const filePath = join(TMP_DIR, name);
    writeFileSync(filePath, JSON.stringify(content));
    return filePath;
}

describe('parseCtrfFile', () => {
    it('parses a valid CTRF file', () => {
        const report = {
            results: {
                tool: { name: 'vitest', version: '1.0.0' },
                summary: { tests: 3, passed: 2, failed: 1, skipped: 0, pending: 0, other: 0 },
                tests: [
                    { name: 'test1', status: 'passed', duration: 100 },
                    { name: 'test2', status: 'passed', duration: 200 },
                    { name: 'test3', status: 'failed', duration: 50, message: 'assertion failed' },
                ],
            },
        };

        const filePath = writeTmpFile('valid.json', report);
        const parsed = parseCtrfFile(filePath);

        expect(parsed.results.tool?.name).toBe('vitest');
        expect(parsed.results.tests).toHaveLength(3);
        expect(parsed.results.summary?.passed).toBe(2);
    });

    it('throws on non-existent file', () => {
        expect(() => parseCtrfFile('/nonexistent/file.json')).toThrow('Failed to read CTRF file');
    });

    it('throws on invalid JSON', () => {
        const filePath = join(TMP_DIR, 'invalid.json');
        writeFileSync(filePath, 'not json');
        expect(() => parseCtrfFile(filePath)).toThrow('Invalid JSON');
    });

    it('throws on invalid CTRF structure', () => {
        const filePath = writeTmpFile('bad-structure.json', { foo: 'bar' });
        expect(() => parseCtrfFile(filePath)).toThrow('Invalid CTRF format');
    });

    it('accepts minimal CTRF structure', () => {
        const report = { results: {} };
        const filePath = writeTmpFile('minimal.json', report);
        const parsed = parseCtrfFile(filePath);
        expect(parsed.results).toBeDefined();
    });
});

describe('summarizeCtrfResults', () => {
    it('returns summary from report summary field', () => {
        const report = {
            results: {
                summary: { tests: 10, passed: 7, failed: 2, skipped: 1, pending: 0, other: 0 },
            },
        };

        const summary = summarizeCtrfResults(report);
        expect(summary.total).toBe(10);
        expect(summary.passed).toBe(7);
        expect(summary.failed).toBe(2);
        expect(summary.skipped).toBe(1);
        expect(summary.hasFailed).toBe(true);
    });

    it('derives summary from tests when no summary field', () => {
        const report = {
            results: {
                tests: [
                    { name: 'a', status: 'passed' as const },
                    { name: 'b', status: 'passed' as const },
                    { name: 'c', status: 'skipped' as const },
                ],
            },
        };

        const summary = summarizeCtrfResults(report);
        expect(summary.total).toBe(3);
        expect(summary.passed).toBe(2);
        expect(summary.failed).toBe(0);
        expect(summary.skipped).toBe(1);
        expect(summary.hasFailed).toBe(false);
    });

    it('reports hasFailed=false when all pass', () => {
        const report = {
            results: {
                summary: { tests: 5, passed: 5, failed: 0, skipped: 0, pending: 0, other: 0 },
            },
        };

        const summary = summarizeCtrfResults(report);
        expect(summary.hasFailed).toBe(false);
    });
});
