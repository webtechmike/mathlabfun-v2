import type { Operation, Question } from "../types";
import { compute } from "./question";

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
 * Canonical spacebucks-per-answer calculator. Both games derive their reward
 * from this; per-game scaling (e.g. tap-attack halving) is applied by the
 * caller.
 *
 * Rules ported from v1's Game4.tsx:
 * - Base by operation.
 * - +1 when the question's result is negative.
 * - +Math.floor(level / 2) as a level bonus.
 * - ×2 when the player's super streak is active.
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
