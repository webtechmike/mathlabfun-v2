import type { Operation, Operator, Question } from "../types";

export const OPERATORS: Record<Operation, Operator> = {
    addition: { symbol: "+", label: "addition" },
    subtraction: { symbol: "-", label: "subtraction" },
    multiplication: { symbol: "x", label: "multiplication" },
    division: { symbol: "÷", label: "division" },
};

export function compute(op: Operation, a: number, b: number): number {
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
 * A division "number bond": split `dividend ÷ divisor` into two friendlier
 * divisions whose quotients add up to the answer.
 *
 *   91 ÷ 7  →  (70 ÷ 7 = 10)  and  (21 ÷ 7 = 3)  →  10 + 3 = 13
 */
export interface NumberBond {
    dividend: number;
    divisor: number;
    /** Largest round-tens multiple of the divisor at or below the dividend. */
    part1: number;
    /** The leftover, `dividend - part1`. */
    part2: number;
    quotient1: number;
    quotient2: number;
}

/**
 * Decompose `dividend ÷ divisor` into a number bond. We peel off the largest
 * round-tens multiple of the divisor (e.g. 70 out of 91 for ÷7), leaving an
 * easy remainder (21) — both halves are exact divisions.
 *
 * Returns `null` when no useful split exists: a non-exact division, a small
 * dividend whose tens-part would be 0 (the quotient is single-digit), or an
 * exact tens multiple with no remainder. Callers fall back to the range hint.
 */
export function buildNumberBond(
    dividend: number,
    divisor: number
): NumberBond | null {
    if (divisor <= 0 || dividend <= 0) return null;
    if (dividend % divisor !== 0) return null;
    const part1 = Math.floor(dividend / divisor / 10) * 10 * divisor;
    if (part1 === 0 || part1 === dividend) return null;
    const part2 = dividend - part1;
    return {
        dividend,
        divisor,
        part1,
        part2,
        quotient1: part1 / divisor,
        quotient2: part2 / divisor,
    };
}

/**
 * Half-width of the range hint window. We center the window on the answer and
 * scale it to the answer's magnitude (~±10%, floored at ±2) so the hint stays
 * useful at every level: tight when answers are small (e.g. 8 → 6–10 instead
 * of a useless 0–10) and proportionally wider — never a giveaway — when answers
 * are large (e.g. 91 → 82–100).
 */
export function hintRangeHalfWidth(answer: number): number {
    return Math.max(2, Math.round(Math.abs(answer) * 0.1));
}

/**
 * Build the hint string for a question. Division problems get a number-bond
 * breakdown when a useful split exists (e.g. "70 ÷ 7 = 10, then 21 ÷ 7 = 3").
 * Everything else (and division too small to split) gets an answer-centered
 * range nudge whose width scales with the answer's magnitude.
 */
export function generateHint(
    answer: number,
    operation?: Operation,
    dividend?: number,
    divisor?: number
): string {
    if (
        operation === "division" &&
        dividend !== undefined &&
        divisor !== undefined
    ) {
        const bond = buildNumberBond(dividend, divisor);
        if (bond) {
            return `${bond.part1} ÷ ${bond.divisor} = ${bond.quotient1}, then ${bond.part2} ÷ ${bond.divisor} = ${bond.quotient2}`;
        }
    }
    const half = hintRangeHalfWidth(answer);
    return `A number between ${answer - half} and ${answer + half}`;
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
            hint: generateHint(answer, op, input1, input2),
        };
        attempts++;
    } while (
        attempts < maxAttempts &&
        lastQuestionKey !== undefined &&
        questionKey(question) === lastQuestionKey
    );

    return question;
}
