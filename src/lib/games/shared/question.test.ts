import { describe, expect, test } from "vitest";
import {
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
