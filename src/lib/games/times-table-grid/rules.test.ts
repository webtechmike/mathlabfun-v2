import { describe, expect, test } from "vitest";
import {
    calculateGridReward,
    cellKey,
    generateProductChoices,
    getGridLevel,
    GRID_LEVELS,
    MAX_GRID_LEVEL,
    pickMissingCells,
} from "./rules";

const seqRng = (values: number[]) => {
    let i = 0;
    return () => values[i++ % values.length] ?? 0;
};

describe("getGridLevel", () => {
    test.each([
        [1, 5],
        [2, 8],
        [3, 10],
        [4, 12],
        [5, 15],
    ] as const)("level %i → %i×%i grid", (level, size) => {
        expect(getGridLevel(level).size).toBe(size);
    });

    test("clamps out-of-range levels", () => {
        expect(getGridLevel(0).level).toBe(1);
        expect(getGridLevel(-3).level).toBe(1);
        expect(getGridLevel(99).level).toBe(MAX_GRID_LEVEL);
    });

    test("matches GRID_LEVELS length", () => {
        expect(MAX_GRID_LEVEL).toBe(GRID_LEVELS.length);
    });
});

describe("cellKey", () => {
    test("formats 1-indexed coordinates", () => {
        expect(cellKey(3, 7)).toBe("3x7");
    });
});

describe("pickMissingCells", () => {
    test("returns the requested count of unique in-bounds cells", () => {
        const cells = pickMissingCells(10, 14, seqRng([0.1, 0.5, 0.9, 0.3]));
        expect(cells).toHaveLength(14);
        const keys = new Set(cells.map((c) => cellKey(c.row, c.col)));
        expect(keys.size).toBe(14);
        for (const { row, col } of cells) {
            expect(row).toBeGreaterThanOrEqual(1);
            expect(row).toBeLessThanOrEqual(10);
            expect(col).toBeGreaterThanOrEqual(1);
            expect(col).toBeLessThanOrEqual(10);
        }
    });

    test("never exceeds the number of cells in the grid", () => {
        const cells = pickMissingCells(3, 100);
        expect(cells.length).toBeLessThanOrEqual(9);
    });

    test("prefers cells outside the ×1 row and column when possible", () => {
        const cells = pickMissingCells(10, 14);
        const trivial = cells.filter((c) => c.row === 1 || c.col === 1);
        // 81 interesting cells exist for a 10×10 grid, far more than 14, so a
        // round should never need to dip into the trivial ×1 band.
        expect(trivial).toHaveLength(0);
    });
});

describe("generateProductChoices", () => {
    test("returns exactly 4 distinct positive values including the product", () => {
        const choices = generateProductChoices({
            row: 6,
            col: 7,
            size: 10,
            rng: seqRng([0.1, 0.4, 0.7, 0.2, 0.9, 0.3]),
        });
        expect(choices).toHaveLength(4);
        expect(new Set(choices).size).toBe(4);
        expect(choices.filter((c) => c === 42)).toHaveLength(1);
        for (const c of choices) expect(c).toBeGreaterThan(0);
    });

    test("includes plausible times-table neighbors as distractors", () => {
        const pool = new Set<number>();
        for (let i = 0; i < 40; i++) {
            const choices = generateProductChoices({
                row: 6,
                col: 7,
                size: 12,
                rng: seqRng([i / 40, (i + 7) / 40, (i + 19) / 40]),
            });
            for (const c of choices) pool.add(c);
        }
        // Expect neighbors like 5×7=35, 7×7=49, 6×8=48, 6×6=36 to surface.
        const expected = [35, 49, 48, 36];
        const hits = expected.filter((n) => pool.has(n));
        expect(hits.length).toBeGreaterThanOrEqual(2);
    });

    test("handles edge cells (1×1) by padding fillers", () => {
        const choices = generateProductChoices({
            row: 1,
            col: 1,
            size: 5,
            rng: seqRng([0.1, 0.3, 0.5, 0.7, 0.2, 0.8]),
        });
        expect(choices).toHaveLength(4);
        expect(new Set(choices).size).toBe(4);
        expect(choices).toContain(1);
        for (const c of choices) expect(c).toBeGreaterThan(0);
    });
});

describe("calculateGridReward", () => {
    test("is half the canonical multiplication reward, min 1", () => {
        // Canonical multiplication at level 1 = 3 → halved & floored = 1.
        expect(calculateGridReward(1)).toBe(1);
        // Level 4 → 3 + floor(4/2) = 5 → halved & floored = 2.
        expect(calculateGridReward(4)).toBe(2);
    });

    test("never drops below 1", () => {
        expect(calculateGridReward(1)).toBeGreaterThanOrEqual(1);
    });
});
