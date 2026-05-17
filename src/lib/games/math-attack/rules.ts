import type { Operation, Operator, Question } from "../types";

const OPERATORS: Record<Operation, Operator> = {
    addition: { symbol: "+", label: "addition" },
    subtraction: { symbol: "-", label: "subtraction" },
    multiplication: { symbol: "x", label: "multiplication" },
    division: { symbol: "÷", label: "division" },
};

function compute(op: Operation, a: number, b: number): number {
    switch (op) {
        case "addition":
            return a + b;
        case "subtraction":
            return a - b;
        case "multiplication":
            return a * b;
        case "division":
            return b === 0 ? 0 : a / b;
    }
}

/**
 * Build the hint string for a target answer. The hint nudges the player toward
 * a 10-wide range, except when the answer is a multiple of 10 (then we widen
 * to ±5 around the answer).
 */
export function generateHint(answer: number): string {
    const lower = Math.floor(answer / 10) * 10;
    const upper = Math.ceil(answer / 10) * 10;
    if (answer % 10 === 0) {
        return `A number between ${answer - 5} and ${answer + 5}`;
    }
    return `A number between ${lower} and ${upper}`;
}

/**
 * Pick an operation based on a 0-100 decider value, matching v1 thresholds:
 * - 0..33   → addition
 * - 34..65  → subtraction
 * - 66..100 → multiplication
 */
export function pickOperation(decider: number): Operation {
    if (decider <= 33) return "addition";
    if (decider < 66) return "subtraction";
    return "multiplication";
}

export interface GenerateQuestionOptions {
    /** Last question key to avoid (`"a+b"` form). */
    lastQuestionKey?: string;
    /** Inclusive upper bound for input1/input2. v1 used 10. */
    maxInput?: number;
    /** Override RNG for deterministic tests. Returns a number in [0, 1). */
    rng?: () => number;
    /** Max attempts to avoid the `lastQuestionKey` before giving up. */
    maxAttempts?: number;
}

export function questionKey(
    q: Pick<Question, "input1" | "input2" | "operator">
): string {
    return `${q.input1}${q.operator.symbol}${q.input2}`;
}

export function generateQuestion(
    options: GenerateQuestionOptions = {}
): Question {
    const {
        lastQuestionKey,
        maxInput = 10,
        rng = Math.random,
        maxAttempts = 50,
    } = options;

    const range = maxInput + 1;

    let attempts = 0;
    let question: Question;
    do {
        const input1 = Math.floor(rng() * range);
        const input2 = Math.floor(rng() * range);
        const decider = Math.floor(rng() * 101);
        const op = pickOperation(decider);
        const answer = compute(op, input1, input2);

        question = {
            input1,
            input2,
            operator: OPERATORS[op],
            answer,
            hint: generateHint(answer),
        };
        attempts++;
    } while (
        attempts < maxAttempts &&
        lastQuestionKey !== undefined &&
        questionKey(question) === lastQuestionKey
    );

    return question;
}

export interface CalculateRewardInput {
    operation: Operation;
    /** Daily streak ≥ 3 doubles rewards. */
    isSuperStreakActive: boolean;
    /** The full question; used for the negative-result bonus. */
    question?: Pick<Question, "input1" | "input2" | "operator">;
    /** Game level. Adds Math.floor(level / 2) to the base reward. */
    level?: number;
}

const BASE_BY_OPERATION: Record<Operation, number> = {
    addition: 1,
    subtraction: 2,
    multiplication: 3,
    division: 3,
};

/**
 * Pure reward calculator. Same rules as v1's Game4.tsx, extracted so it can be
 * unit-tested and reused without React.
 */
export function calculateReward({
    operation,
    isSuperStreakActive,
    question,
    level = 1,
}: CalculateRewardInput): number {
    let reward = BASE_BY_OPERATION[operation] ?? 1;

    if (question) {
        const result = compute(
            question.operator.label,
            question.input1,
            question.input2
        );
        if (result < 0) {
            reward += 1;
        }
    }

    const levelBonus = Math.floor(level / 2);
    reward += levelBonus;

    if (isSuperStreakActive) {
        reward *= 2;
    }

    return reward;
}
