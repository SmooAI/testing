import { describe, expect, it } from 'vitest';
import { parseLcov } from './index';

const LCOV = [
    'TN:',
    'SF:src/a.ts',
    'FNF:4',
    'FNH:3',
    'DA:1,1',
    'DA:2,0',
    'LF:10',
    'LH:7',
    'BRF:6',
    'BRH:2',
    'end_of_record',
    'SF:src/b.ts',
    'DA:1,5',
    'DA:2,0',
    'DA:3,1',
    'end_of_record',
    '',
].join('\n');

describe('parseLcov', () => {
    it('sums LF/LH and derives from DA when absent', () => {
        const s = parseLcov(LCOV);
        // a.ts uses LF/LH (10/7) — DA lines must not override them.
        expect(s.files['src/a.ts']).toEqual([7, 10, 2, 6, 3, 4]);
        // b.ts has no LF/LH — derived from DA: 3 lines, 2 hit.
        expect(s.files['src/b.ts']).toEqual([2, 3, 0, 0, 0, 0]);
        expect(s.linesCovered).toBe(9);
        expect(s.linesTotal).toBe(13);
        expect(s.branchesTotal).toBe(6);
        expect(s.functionsCovered).toBe(3);
    });

    it('rejects non-lcov input', () => {
        expect(() => parseLcov('{"not":"lcov"}')).toThrow(/LCOV/);
        expect(() => parseLcov('')).toThrow(/LCOV/);
    });
});
