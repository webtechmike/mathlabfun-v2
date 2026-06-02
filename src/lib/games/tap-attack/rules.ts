import type { Question } from "../types";
import { calculateReward, type CalculateRewardInput } from "../shared/reward";
import { getLevelSpec } from "../shared/levels";

/**
 * Choice count by level, sourced from the curriculum: 3 options for levels
 * 1–5, 4 options (2×2 grid) for levels 6–10.
 */
export function choiceCountForLevel(level: number): 3 | 4 {
    return getLevelSpec(level).choiceCount;
}

export interface GenerateChoicesOptions {
    question: Question;
    count: 3 | 4;
    rng?: () => number;
    /** When provided, distractors and fillers are kept inside this range. */
    minAnswer?: number;
    maxAnswer?: number;
}

/**
 * Build a multiple-choice answer set for a question. Distractors are
 * deliberately plausible — off-by-one, confused operations, times-table
 * neighbors, and (for division) dividend/divisor confusion — so the game
 * tests understanding instead of being a coin flip.
 *
 * Guarantees:
 * - Returned array length === `count`.
 * - `question.answer` is included exactly once.
 * - All entries are distinct.
 * - When `minAnswer`/`maxAnswer` are given, distractors stay in range where
 *   possible and fillers always do.
 */
export function generateChoices({
    question,
    count,
    rng = Math.random,
    minAnswer,
    maxAnswer,
}: GenerateChoicesOptions): number[] {
    const { input1: a, input2: b, operator, answer } = question;
    const op = operator.label;

    const pool = new Set<number>();

    // Off-by-one — the single most common arithmetic slip.
    pool.add(answer + 1);
    pool.add(answer - 1);

    if (op === "division") {
        // Confused-operation distractors (a×b etc.) are wildly out of scale
        // for division, so use division-specific near-misses instead.
        pool.add(answer + 2);
        pool.add(answer - 2);
        pool.add(b); // picking the divisor
        pool.add(a); // picking the dividend
    } else {
        // Confused-operation errors.
        if (op !== "addition") pool.add(a + b);
        if (op !== "subtraction") pool.add(a - b);
        if (op !== "multiplication") pool.add(a * b);

        // Times-table neighbors — classic multiplication mistakes.
        if (op === "multiplication") {
            pool.add((a + 1) * b);
            pool.add((a - 1) * b);
            pool.add(a * (b + 1));
            pool.add(a * (b - 1));
        }
    }

    pool.delete(answer);

    const hasRange = minAnswer !== undefined && maxAnswer !== undefined;
    let candidates = [...pool];
    if (hasRange) {
        const inRange = candidates.filter(
            (c) => c >= minAnswer && c <= maxAnswer
        );
        // Only narrow to in-range candidates if we'd still have enough.
        if (inRange.length >= count - 1) candidates = inRange;
    }

    const distractors = shuffled(candidates, rng).slice(0, count - 1);

    // Pad with fillers if the natural pool is too small (e.g. trivial
    // questions like 0 + 0). Fillers respect the answer range when given.
    let safety = 80;
    while (distractors.length < count - 1 && safety-- > 0) {
        let filler: number;
        if (hasRange) {
            filler =
                Math.floor(rng() * (maxAnswer - minAnswer + 1)) + minAnswer;
        } else {
            filler = answer + (Math.floor(rng() * 10) - 5);
        }
        if (filler !== answer && !distractors.includes(filler)) {
            distractors.push(filler);
        }
    }

    return shuffled([...distractors, answer], rng);
}

function shuffled<T>(arr: T[], rng: () => number): T[] {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

/**
 * Tap-attack rewards are exactly half of the canonical math-attack reward,
 * floored, with a minimum of 1. Recognition is easier than recall, so the
 * spacebucks economy reflects that.
 */
export function calculateTapReward(input: CalculateRewardInput): number {
    const canonical = calculateReward(input);
    return Math.max(1, Math.floor(canonical / 2));
}
