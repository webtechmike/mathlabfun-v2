import { describe, expect, test } from "vitest";
import {
    calculateTapReward,
    choiceCountForLevel,
    generateChoices,
} from "./rules";
import type { Question } from "../types";

const q = (
    input1: number,
    input2: number,
    op: "addition" | "subtraction" | "multiplication" | "division",
    answer: number
): Question => {
    const symbol = {
        addition: "+",
        subtraction: "-",
        multiplication: "x",
        division: "÷",
    }[op];
    return {
        input1,
        input2,
        operator: { symbol, label: op },
        answer,
        hint: "",
    };
};

const seqRng = (values: number[]) => {
    let i = 0;
    return () => values[i++ % values.length] ?? 0;
};

describe("choiceCountForLevel", () => {
    test.each([
        [1, 3],
        [2, 3],
        [3, 3],
        [4, 3],
        [5, 3],
        [6, 3],
        [7, 3],
        [8, 4],
        [9, 4],
        [10, 4],
        [11, 4],
        [12, 4],
        [13, 4],
    ] as const)("level %i → %i choices", (level, expected) => {
        expect(choiceCountForLevel(level)).toBe(expected);
    });
});

describe("generateChoices", () => {
    test("always contains the correct answer exactly once", () => {
        const question = q(7, 8, "addition", 15);
        for (const count of [3, 4] as const) {
            const choices = generateChoices({ question, count, rng: () => 0 });
            expect(choices.filter((c) => c === 15)).toHaveLength(1);
        }
    });

    test("returns exactly `count` distinct values", () => {
        const question = q(6, 7, "multiplication", 42);
        for (const count of [3, 4] as const) {
            const choices = generateChoices({
                question,
                count,
                rng: seqRng([0.1, 0.4, 0.7, 0.2, 0.9, 0.3]),
            });
            expect(choices).toHaveLength(count);
            expect(new Set(choices).size).toBe(count);
        }
    });

    test("addition distractors include off-by-one and confused operations", () => {
        const question = q(3, 4, "addition", 7);
        const pool = new Set<number>();
        for (let i = 0; i < 30; i++) {
            const choices = generateChoices({
                question,
                count: 4,
                rng: seqRng([i / 30, (i + 7) / 30, (i + 13) / 30]),
            });
            for (const c of choices) pool.add(c);
        }
        // Should at least see: 7 (answer), 6, 8 (off-by-one), 12 (a*b),
        // -1 (a-b).
        expect(pool.has(7)).toBe(true);
        expect(pool.has(6) || pool.has(8)).toBe(true);
        expect(pool.has(12)).toBe(true); // 3 * 4 — confused-operation
        expect(pool.has(-1)).toBe(true); // 3 - 4 — confused-operation
    });

    test("multiplication adds times-table neighbors", () => {
        const question = q(6, 7, "multiplication", 42);
        const pool = new Set<number>();
        for (let i = 0; i < 30; i++) {
            const choices = generateChoices({
                question,
                count: 4,
                rng: seqRng([i / 30, (i + 5) / 30, (i + 17) / 30]),
            });
            for (const c of choices) pool.add(c);
        }
        // Expect neighbors 5*7=35, 7*7=49, 6*6=36, 6*8=48 to appear.
        const expected = [35, 49, 36, 48];
        const hits = expected.filter((n) => pool.has(n));
        expect(hits.length).toBeGreaterThanOrEqual(2);
    });

    test("handles trivial question (0 + 0) by padding with fillers", () => {
        const question = q(0, 0, "addition", 0);
        const choices = generateChoices({
            question,
            count: 4,
            rng: seqRng([0.1, 0.3, 0.5, 0.7, 0.2, 0.8, 0.4]),
        });
        expect(choices).toHaveLength(4);
        expect(new Set(choices).size).toBe(4);
        expect(choices).toContain(0);
    });

    test("division uses near-misses and divisor/dividend confusion, not a×b", () => {
        const question = q(56, 8, "division", 7); // 56 ÷ 8 = 7
        const pool = new Set<number>();
        for (let i = 0; i < 40; i++) {
            const choices = generateChoices({
                question,
                count: 4,
                rng: seqRng([i / 40, (i + 11) / 40, (i + 23) / 40]),
            });
            for (const c of choices) pool.add(c);
        }
        expect(pool.has(7)).toBe(true); // answer
        expect(pool.has(8)).toBe(true); // divisor confusion
        expect(pool.has(56)).toBe(true); // dividend confusion
        // The absurd confused-operation distractor (56 × 8 = 448) must never
        // appear for division.
        expect(pool.has(448)).toBe(false);
    });

    test("keeps distractors within the answer range when provided", () => {
        const question = q(1, 1, "addition", 2);
        for (let i = 0; i < 200; i++) {
            const choices = generateChoices({
                question,
                count: 3,
                minAnswer: 0,
                maxAnswer: 9,
            });
            expect(choices).toHaveLength(3);
            for (const c of choices) {
                expect(c).toBeGreaterThanOrEqual(0);
                expect(c).toBeLessThanOrEqual(9);
            }
        }
    });
});

describe("calculateTapReward", () => {
    test("is exactly half of canonical reward (floored)", () => {
        // Canonical: addition = 1 → halved & floored = 0 → floored to min 1.
        expect(
            calculateTapReward({
                operation: "addition",
                isSuperStreakActive: false,
            })
        ).toBe(1);
        // Canonical: multiplication = 3 → 1.
        expect(
            calculateTapReward({
                operation: "multiplication",
                isSuperStreakActive: false,
            })
        ).toBe(1);
        // Canonical: multiplication with super streak = 6 → 3.
        expect(
            calculateTapReward({
                operation: "multiplication",
                isSuperStreakActive: true,
            })
        ).toBe(3);
        // Canonical: multiplication + level 4 + super = 10 → 5.
        expect(
            calculateTapReward({
                operation: "multiplication",
                isSuperStreakActive: true,
                level: 4,
            })
        ).toBe(5);
    });

    test("never drops below 1", () => {
        expect(
            calculateTapReward({
                operation: "addition",
                isSuperStreakActive: false,
                level: 1,
            })
        ).toBe(1);
    });
});
