import { describe, expect, test } from "vitest";
import {
    calculateReward,
    generateHint,
    generateQuestion,
    pickOperation,
    questionKey,
} from "./rules";
import type { Question } from "../types";

const q = (
    input1: number,
    input2: number,
    op: "addition" | "subtraction" | "multiplication" | "division"
): Pick<Question, "input1" | "input2" | "operator"> => {
    const symbol = {
        addition: "+",
        subtraction: "-",
        multiplication: "x",
        division: "÷",
    }[op];
    return { input1, input2, operator: { symbol, label: op } };
};

describe("calculateReward", () => {
    describe("base reward by operation", () => {
        test("addition → 1", () => {
            expect(
                calculateReward({
                    operation: "addition",
                    isSuperStreakActive: false,
                    question: q(5, 3, "addition"),
                })
            ).toBe(1);
        });
        test("subtraction → 2", () => {
            expect(
                calculateReward({
                    operation: "subtraction",
                    isSuperStreakActive: false,
                    question: q(8, 3, "subtraction"),
                })
            ).toBe(2);
        });
        test("multiplication → 3", () => {
            expect(
                calculateReward({
                    operation: "multiplication",
                    isSuperStreakActive: false,
                    question: q(4, 6, "multiplication"),
                })
            ).toBe(3);
        });
        test("division → 3", () => {
            expect(
                calculateReward({
                    operation: "division",
                    isSuperStreakActive: false,
                    question: q(12, 4, "division"),
                })
            ).toBe(3);
        });
    });

    describe("negative-result bonus", () => {
        test("subtraction yielding negative → +1", () => {
            expect(
                calculateReward({
                    operation: "subtraction",
                    isSuperStreakActive: false,
                    question: q(7, 8, "subtraction"),
                })
            ).toBe(3);
        });
        test("addition yielding negative → +1", () => {
            expect(
                calculateReward({
                    operation: "addition",
                    isSuperStreakActive: false,
                    question: q(-5, 2, "addition"),
                })
            ).toBe(2);
        });
        test("multiplication yielding negative → +1", () => {
            expect(
                calculateReward({
                    operation: "multiplication",
                    isSuperStreakActive: false,
                    question: q(-2, 3, "multiplication"),
                })
            ).toBe(4);
        });
        test("positive result → no bonus", () => {
            expect(
                calculateReward({
                    operation: "addition",
                    isSuperStreakActive: false,
                    question: q(5, 3, "addition"),
                })
            ).toBe(1);
        });
        test("zero result → no bonus", () => {
            expect(
                calculateReward({
                    operation: "subtraction",
                    isSuperStreakActive: false,
                    question: q(5, 5, "subtraction"),
                })
            ).toBe(2);
        });
    });

    describe("super streak", () => {
        test("doubles when active", () => {
            expect(
                calculateReward({
                    operation: "multiplication",
                    isSuperStreakActive: true,
                    question: q(5, 3, "multiplication"),
                })
            ).toBe(6);
        });
        test("does not double when inactive", () => {
            expect(
                calculateReward({
                    operation: "multiplication",
                    isSuperStreakActive: false,
                    question: q(5, 3, "multiplication"),
                })
            ).toBe(3);
        });
    });

    describe("level bonus", () => {
        test("level 1 → no bonus", () => {
            expect(
                calculateReward({
                    operation: "addition",
                    isSuperStreakActive: false,
                    question: q(5, 3, "addition"),
                    level: 1,
                })
            ).toBe(1);
        });
        test("level 2 → +1", () => {
            expect(
                calculateReward({
                    operation: "addition",
                    isSuperStreakActive: false,
                    question: q(5, 3, "addition"),
                    level: 2,
                })
            ).toBe(2);
        });
        test("level 3 → +1", () => {
            expect(
                calculateReward({
                    operation: "addition",
                    isSuperStreakActive: false,
                    question: q(5, 3, "addition"),
                    level: 3,
                })
            ).toBe(2);
        });
        test("level 4 → +2", () => {
            expect(
                calculateReward({
                    operation: "addition",
                    isSuperStreakActive: false,
                    question: q(5, 3, "addition"),
                    level: 4,
                })
            ).toBe(3);
        });
        test("level 6 → +3", () => {
            expect(
                calculateReward({
                    operation: "addition",
                    isSuperStreakActive: false,
                    question: q(5, 3, "addition"),
                    level: 6,
                })
            ).toBe(4);
        });
    });

    describe("combined modifiers", () => {
        test("negative + super streak", () => {
            expect(
                calculateReward({
                    operation: "multiplication",
                    isSuperStreakActive: true,
                    question: q(-2, 5, "multiplication"),
                })
            ).toBe(8);
        });
        test("level + super streak", () => {
            expect(
                calculateReward({
                    operation: "multiplication",
                    isSuperStreakActive: true,
                    question: q(5, 3, "multiplication"),
                    level: 4,
                })
            ).toBe(10);
        });
        test("negative + level + super streak", () => {
            expect(
                calculateReward({
                    operation: "multiplication",
                    isSuperStreakActive: true,
                    question: q(-2, 5, "multiplication"),
                    level: 6,
                })
            ).toBe(14);
        });
    });

    describe("edge cases", () => {
        test("missing question → just base reward", () => {
            expect(
                calculateReward({
                    operation: "addition",
                    isSuperStreakActive: false,
                })
            ).toBe(1);
        });
        test("zero values → no negative bonus", () => {
            expect(
                calculateReward({
                    operation: "addition",
                    isSuperStreakActive: false,
                    question: q(0, 0, "addition"),
                })
            ).toBe(1);
        });
    });
});

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
        // First call produces 5+4. Provide that as last and force the next
        // attempt to pick different inputs.
        const seq = [0.5, 0.4, 0.0, 0.7, 0.2, 0.0];
        const rng = () => seq.shift() ?? 0;
        const question = generateQuestion({
            rng,
            lastQuestionKey: "5+4",
        });
        expect(questionKey(question)).not.toBe("5+4");
    });
});
