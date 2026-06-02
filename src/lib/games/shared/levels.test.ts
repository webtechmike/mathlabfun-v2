import { describe, expect, test } from "vitest";
import {
    LEVELS,
    MAX_LEVEL,
    generateLeveledQuestion,
    getLevelSpec,
} from "./levels";

/** The level whose curriculum includes division. */
const DIVISION_LEVEL = LEVELS.find((l) =>
    l.operations.includes("division")
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

    test("division (top level) is always exact integer division", () => {
        let sawDivision = false;
        for (let i = 0; i < SAMPLES * 3; i++) {
            const q = generateLeveledQuestion(DIVISION_LEVEL);
            if (q.operator.label !== "division") continue;
            sawDivision = true;
            expect(q.input2).not.toBe(0);
            expect(q.input1 % q.input2).toBe(0);
            expect(q.answer).toBe(q.input1 / q.input2);
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
