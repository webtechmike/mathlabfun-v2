import { describe, expect, test } from "vitest";
import { calculateReward } from "./reward";
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
