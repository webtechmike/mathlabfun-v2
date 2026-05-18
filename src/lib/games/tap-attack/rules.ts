import type { Question } from "../types";
import { calculateReward, type CalculateRewardInput } from "../shared/reward";

/**
 * Choice count by level. Easier levels get fewer distractors so younger
 * players aren't overwhelmed. Acts as a stand-in for an age-based heuristic
 * until signup collects an age field — at that point swap to
 * `min(ageBasedCap, levelBasedCap)`.
 */
export function choiceCountForLevel(level: number): 3 | 4 {
    return level <= 3 ? 3 : 4;
}

export interface GenerateChoicesOptions {
    question: Question;
    count: 3 | 4;
    rng?: () => number;
}

/**
 * Build a multiple-choice answer set for a question. Distractors are
 * deliberately plausible — off-by-one, confused operations, and (for
 * multiplication) common times-table neighbors — so the game tests
 * understanding instead of being a coin flip.
 *
 * Guarantees:
 * - Returned array length === `count`.
 * - `question.answer` is included exactly once.
 * - All entries are distinct.
 */
export function generateChoices({
    question,
    count,
    rng = Math.random,
}: GenerateChoicesOptions): number[] {
    const { input1: a, input2: b, operator, answer } = question;
    const op = operator.label;

    const pool = new Set<number>();

    // Off-by-one — the single most common arithmetic slip.
    pool.add(answer + 1);
    pool.add(answer - 1);

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

    pool.delete(answer);

    const distractors = shuffled([...pool], rng).slice(0, count - 1);

    // Pad with random fillers near the answer if the natural pool is too
    // small (can happen for trivial questions like 0 + 0).
    let safety = 50;
    while (distractors.length < count - 1 && safety-- > 0) {
        const offset = Math.floor(rng() * 10) - 5;
        const filler = answer + offset;
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
