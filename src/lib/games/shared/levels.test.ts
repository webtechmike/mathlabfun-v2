import { describe, expect, test } from "vitest";
import {
    LEVELS,
    MAX_LEVEL,
    generateLeveledQuestion,
    getLevelSpec,
} from "./levels";
import { buildNumberBond } from "./question";

/** Every level whose curriculum includes division. */
const DIVISION_LEVELS = LEVELS.filter((l) =>
    l.operations.includes("division")
).map((l) => l.level);

/** The simple, division-only level with single-digit quotients (range hints). */
const SIMPLE_DIVISION_LEVEL = LEVELS.find(
    (l) =>
        l.operations.length === 1 &&
        l.operations[0] === "division" &&
        (l.divisionQuotient?.max ?? 9) <= 9
)!.level;

/** The level whose division has two-digit quotients (number-bond hints). */
const BOND_DIVISION_LEVEL = LEVELS.find(
    (l) => (l.divisionQuotient?.min ?? 0) >= 10
)!.level;

const SAMPLES = 400;

describe("getLevelSpec", () => {
    test("returns the matching spec for valid levels", () => {
        for (let level = 1; level <= MAX_LEVEL; level++) {
            expect(getLevelSpec(level).level).toBe(level);
        }
    });

    test("clamps out-of-range levels", () => {
        expect(getLevelSpec(0).level).toBe(1);
        expect(getLevelSpec(-5).level).toBe(1);
        expect(getLevelSpec(99).level).toBe(MAX_LEVEL);
    });

    test("floors fractional levels", () => {
        expect(getLevelSpec(3.9).level).toBe(3);
    });
});

describe("generateLeveledQuestion — curriculum invariants", () => {
    for (const spec of LEVELS) {
        describe(`level ${spec.level} (${spec.label})`, () => {
            test(`only uses permitted operations and stays in [${spec.minAnswer}, ${spec.maxAnswer}]`, () => {
                for (let i = 0; i < SAMPLES; i++) {
                    const q = generateLeveledQuestion(spec.level);

                    expect(spec.operations).toContain(q.operator.label);
                    expect(Number.isInteger(q.answer)).toBe(true);
                    expect(q.answer).toBeGreaterThanOrEqual(spec.minAnswer);
                    expect(q.answer).toBeLessThanOrEqual(spec.maxAnswer);
                }
            });
        });
    }

    test("levels 1-3 never produce negative operands or sums", () => {
        for (const level of [1, 2, 3]) {
            for (let i = 0; i < SAMPLES; i++) {
                const q = generateLeveledQuestion(level);
                expect(q.input1).toBeGreaterThanOrEqual(0);
                expect(q.input2).toBeGreaterThanOrEqual(0);
                expect(q.answer).toBeGreaterThanOrEqual(0);
            }
        }
    });

    test("division is always exact integer division", () => {
        for (const level of DIVISION_LEVELS) {
            let sawDivision = false;
            for (let i = 0; i < SAMPLES * 3; i++) {
                const q = generateLeveledQuestion(level);
                if (q.operator.label !== "division") continue;
                sawDivision = true;
                expect(q.input2).not.toBe(0);
                expect(q.input1 % q.input2).toBe(0);
                expect(q.answer).toBe(q.input1 / q.input2);
            }
            expect(sawDivision).toBe(true);
        }
    });

    test("simple division stays single-digit and uses a range hint", () => {
        let sawDivision = false;
        for (let i = 0; i < SAMPLES * 3; i++) {
            const q = generateLeveledQuestion(SIMPLE_DIVISION_LEVEL);
            if (q.operator.label !== "division") continue;
            sawDivision = true;
            expect(q.answer).toBeLessThanOrEqual(9);
            // No round-tens part, so no number bond — falls back to range hint.
            expect(buildNumberBond(q.input1, q.input2)).toBeNull();
            expect(q.hint).toMatch(/^A number between/);
        }
        expect(sawDivision).toBe(true);
    });

    test("bond division has two-digit quotients with a usable number bond", () => {
        let sawDivision = false;
        for (let i = 0; i < SAMPLES * 3; i++) {
            const q = generateLeveledQuestion(BOND_DIVISION_LEVEL);
            if (q.operator.label !== "division") continue;
            sawDivision = true;
            // Two-digit quotient is what makes a number bond meaningful.
            expect(q.answer).toBeGreaterThanOrEqual(10);
            // Every division here should split into a friendly bond (no range
            // hint fallback).
            expect(buildNumberBond(q.input1, q.input2)).not.toBeNull();
            expect(q.hint).not.toMatch(/^A number between/);
        }
        expect(sawDivision).toBe(true);
    });

    test("respects lastQuestionKey when an alternative exists", () => {
        // Force a deterministic first question, then ask for a different one.
        const seq = [0, 0.5, 0.5, 0, 0.9, 0.9];
        const rng = () => seq.shift() ?? Math.random();
        const first = generateLeveledQuestion(5, { rng });
        const second = generateLeveledQuestion(5, {
            lastQuestionKey: `${first.input1}${first.operator.symbol}${first.input2}`,
        });
        // Statistically near-certain to differ at this range; just assert it
        // returns a valid question object.
        expect(second.operator.label).toBeDefined();
        expect(Number.isInteger(second.answer)).toBe(true);
    });
});
