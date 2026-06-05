import { describe, expect, test } from "vitest";
import {
    buildNumberBond,
    generateHint,
    generateQuestion,
    pickOperation,
    questionKey,
} from "./question";

describe("generateHint", () => {
    test("non-multiple of 10 returns the bracketing tens", () => {
        expect(generateHint(13)).toBe("A number between 10 and 20");
    });
    test("multiple of 10 widens to ±5", () => {
        expect(generateHint(20)).toBe("A number between 15 and 25");
    });
    test("zero is treated as a multiple of 10", () => {
        expect(generateHint(0)).toBe("A number between -5 and 5");
    });
    test("two-digit division quotient yields a number-bond hint", () => {
        expect(generateHint(13, "division", 91, 7)).toBe(
            "70 ÷ 7 = 10, then 21 ÷ 7 = 3"
        );
    });
    test("single-digit division quotient falls back to range hint", () => {
        // 56 ÷ 8 = 7: tens-part is 0, so no useful bond.
        expect(generateHint(7, "division", 56, 8)).toBe(
            "A number between 0 and 10"
        );
    });
});

describe("buildNumberBond", () => {
    test("splits a two-digit-quotient division into round-tens parts", () => {
        expect(buildNumberBond(91, 7)).toEqual({
            dividend: 91,
            divisor: 7,
            part1: 70,
            part2: 21,
            quotient1: 10,
            quotient2: 3,
        });
    });
    test("returns null when the tens-part would be 0 (single-digit quotient)", () => {
        expect(buildNumberBond(56, 8)).toBeNull();
    });
    test("returns null for an exact tens multiple with no remainder", () => {
        expect(buildNumberBond(70, 7)).toBeNull();
    });
    test("returns null for non-exact or non-positive division", () => {
        expect(buildNumberBond(50, 7)).toBeNull();
        expect(buildNumberBond(0, 7)).toBeNull();
        expect(buildNumberBond(91, 0)).toBeNull();
    });
});

describe("pickOperation", () => {
    test.each([
        [0, "addition"],
        [33, "addition"],
        [34, "subtraction"],
        [65, "subtraction"],
        [66, "multiplication"],
        [100, "multiplication"],
    ] as const)("decider %i → %s", (decider, expected) => {
        expect(pickOperation(decider)).toBe(expected);
    });
});

describe("generateQuestion", () => {
    test("emits a fully-formed question with a correct answer", () => {
        const seq = [0.5, 0.4, 0.0]; // input1=5, input2=4, decider=0 → addition
        const rng = () => seq.shift() ?? 0;
        const question = generateQuestion({ rng });
        expect(question.input1).toBe(5);
        expect(question.input2).toBe(4);
        expect(question.operator.label).toBe("addition");
        expect(question.answer).toBe(9);
        expect(question.hint).toMatch(/^A number between/);
    });

    test("avoids the lastQuestionKey when possible", () => {
        const seq = [0.5, 0.4, 0.0, 0.7, 0.2, 0.0];
        const rng = () => seq.shift() ?? 0;
        const question = generateQuestion({
            rng,
            lastQuestionKey: "5+4",
        });
        expect(questionKey(question)).not.toBe("5+4");
    });
});
