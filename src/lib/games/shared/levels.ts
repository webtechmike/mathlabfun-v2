import type { Operation, Question } from "../types";
import { OPERATORS, compute, generateHint, questionKey } from "./question";

/**
 * The level curriculum. Each level constrains which operations appear and the
 * inclusive range the *answer* must fall in. Difficulty grows by widening the
 * answer range, introducing negatives, then layering operations. The bottom
 * of the ramp is deliberately tiny so a pre-K learner can succeed:
 *
 *   1 → addition, sums 0–5     (very gentle entry)
 *   2 → addition, sums 0–10
 *   3 → addition, sums 0–20
 *   4 → addition, sums 0–50
 *   5 → addition, sums 0–99
 *   6 → subtraction, 0–20      (subtraction introduced)
 *   7 → addition + subtraction, −100–100 (negatives introduced)
 *   8 → multiplication, products 0–50
 *   9 → multiplication, products 0–100
 *  10 → multiplication, products −100–100
 *  11 → add + subtract + multiply, −100–100
 *  12 → division facts (single-digit quotients), range hints
 *  13 → all of the above + division (two-digit quotients), number-bond hints
 *
 * `choiceCount` drives the tap-attack grid: 3 options (1×3) while it's still
 * addition/subtraction (levels 1–7), 4 options (2×2) once multiplication
 * appears (levels 8–13).
 *
 * `roundSeconds` is the per-question countdown — generous early, tightening
 * later. `forgivingTimeout` means a timeout does NOT reset the reward streak,
 * so young learners can take their time without feeling punished.
 */
export interface LevelSpec {
    level: number;
    /** Short human-readable description for UI chips. */
    label: string;
    operations: Operation[];
    minAnswer: number;
    maxAnswer: number;
    choiceCount: 3 | 4;
    roundSeconds: number;
    forgivingTimeout: boolean;
    /**
     * For levels with division: the inclusive quotient range to generate.
     * Single-digit quotients (e.g. 2–9) stay easy and show range hints;
     * two-digit quotients (e.g. 11–15) unlock the number-bond hint. Ignored by
     * non-division levels.
     */
    divisionQuotient?: { min: number; max: number };
}

export const MAX_LEVEL = 13;

export const LEVELS: LevelSpec[] = [
    {
        level: 1,
        label: "Addition up to 5",
        operations: ["addition"],
        minAnswer: 0,
        maxAnswer: 5,
        choiceCount: 3,
        roundSeconds: 60,
        forgivingTimeout: true,
    },
    {
        level: 2,
        label: "Addition up to 10",
        operations: ["addition"],
        minAnswer: 0,
        maxAnswer: 10,
        choiceCount: 3,
        roundSeconds: 60,
        forgivingTimeout: true,
    },
    {
        level: 3,
        label: "Addition up to 20",
        operations: ["addition"],
        minAnswer: 0,
        maxAnswer: 20,
        choiceCount: 3,
        roundSeconds: 50,
        forgivingTimeout: true,
    },
    {
        level: 4,
        label: "Addition up to 50",
        operations: ["addition"],
        minAnswer: 0,
        maxAnswer: 50,
        choiceCount: 3,
        roundSeconds: 45,
        forgivingTimeout: true,
    },
    {
        level: 5,
        label: "Addition up to 99",
        operations: ["addition"],
        minAnswer: 0,
        maxAnswer: 99,
        choiceCount: 3,
        roundSeconds: 40,
        forgivingTimeout: false,
    },
    {
        level: 6,
        label: "Subtraction up to 20",
        operations: ["subtraction"],
        minAnswer: 0,
        maxAnswer: 20,
        choiceCount: 3,
        roundSeconds: 45,
        forgivingTimeout: false,
    },
    {
        level: 7,
        label: "Add & subtract (±100)",
        operations: ["addition", "subtraction"],
        minAnswer: -100,
        maxAnswer: 100,
        choiceCount: 3,
        roundSeconds: 35,
        forgivingTimeout: false,
    },
    {
        level: 8,
        label: "Multiply up to 50",
        operations: ["multiplication"],
        minAnswer: 0,
        maxAnswer: 50,
        choiceCount: 4,
        roundSeconds: 35,
        forgivingTimeout: false,
    },
    {
        level: 9,
        label: "Multiply up to 100",
        operations: ["multiplication"],
        minAnswer: 0,
        maxAnswer: 100,
        choiceCount: 4,
        roundSeconds: 30,
        forgivingTimeout: false,
    },
    {
        level: 10,
        label: "Multiply with negatives",
        operations: ["multiplication"],
        minAnswer: -100,
        maxAnswer: 100,
        choiceCount: 4,
        roundSeconds: 30,
        forgivingTimeout: false,
    },
    {
        level: 11,
        label: "Mixed (±100)",
        operations: ["addition", "subtraction", "multiplication"],
        minAnswer: -100,
        maxAnswer: 100,
        choiceCount: 4,
        roundSeconds: 25,
        forgivingTimeout: false,
    },
    {
        level: 12,
        label: "Division facts",
        operations: ["division"],
        minAnswer: 0,
        maxAnswer: 99,
        choiceCount: 4,
        roundSeconds: 35,
        forgivingTimeout: false,
        divisionQuotient: { min: 2, max: 9 },
    },
    {
        level: 13,
        label: "Mixed + division",
        operations: ["addition", "subtraction", "multiplication", "division"],
        minAnswer: -100,
        maxAnswer: 100,
        choiceCount: 4,
        roundSeconds: 25,
        forgivingTimeout: false,
        divisionQuotient: { min: 11, max: 15 },
    },
];

/** Clamp any incoming level into the valid 1..MAX_LEVEL range. */
export function getLevelSpec(level: number): LevelSpec {
    const clamped = Math.min(Math.max(1, Math.floor(level)), MAX_LEVEL);
    return LEVELS[clamped - 1];
}

function randInt(rng: () => number, lo: number, hi: number): number {
    return Math.floor(rng() * (hi - lo + 1)) + lo;
}

interface Operands {
    a: number;
    b: number;
}

/**
 * Addition operands whose sum lands in [lo, hi], with both operands also kept
 * inside [lo, hi] so we never show e.g. "−5 + 14" at a positive-only level.
 */
function buildAddition(spec: LevelSpec, rng: () => number): Operands {
    const { minAnswer: lo, maxAnswer: hi } = spec;
    const s = randInt(rng, lo, hi);
    const aLo = Math.max(lo, s - hi);
    const aHi = Math.min(hi, s - lo);
    const a = randInt(rng, aLo, aHi);
    return { a, b: s - a };
}

/** Subtraction operands whose difference lands in [lo, hi]. */
function buildSubtraction(spec: LevelSpec, rng: () => number): Operands {
    const { minAnswer: lo, maxAnswer: hi } = spec;
    const d = randInt(rng, lo, hi);
    const bLo = Math.max(lo, lo - d);
    const bHi = Math.min(hi, hi - d);
    const b = randInt(rng, bLo, bHi);
    return { a: d + b, b };
}

const FACTOR_CAP = 12;

/**
 * Multiplication operands whose product lands in [lo, hi]. Factors are capped
 * at ±12 to keep questions inside familiar times-table territory; the second
 * factor is then constrained to whatever keeps the product in range.
 */
function buildMultiplication(spec: LevelSpec, rng: () => number): Operands {
    const { minAnswer: lo, maxAnswer: hi } = spec;
    const factorLo = lo < 0 ? -FACTOR_CAP : 0;
    const factorHi = FACTOR_CAP;

    for (let i = 0; i < 60; i++) {
        const a = randInt(rng, factorLo, factorHi);
        if (a === 0) {
            if (lo <= 0 && hi >= 0) {
                return { a, b: randInt(rng, factorLo, factorHi) };
            }
            continue;
        }
        let kLo: number;
        let kHi: number;
        if (a > 0) {
            kLo = Math.ceil(lo / a);
            kHi = Math.floor(hi / a);
        } else {
            kLo = Math.ceil(hi / a);
            kHi = Math.floor(lo / a);
        }
        kLo = Math.max(kLo, factorLo);
        kHi = Math.min(kHi, factorHi);
        if (kLo > kHi) continue;
        return { a, b: randInt(rng, kLo, kHi) };
    }
    return { a: 0, b: 0 };
}

/**
 * Division: always clean integer quotients (no remainders). We pick a divisor
 * in 2–9 and a quotient in the level's `divisionQuotient` range, then derive
 * the dividend, so `a ÷ b` is exact.
 *
 * The quotient range is the difficulty dial:
 * - Single-digit (e.g. 2–9) keeps it to plain division facts; these fall back
 *   to the range hint since there's no round-tens part to split.
 * - Two-digit (e.g. 11–15, avoiding multiples of 10 which have no remainder)
 *   is where the number-bond hint pays off, splitting the dividend into
 *   friendlier round-tens parts (91 ÷ 7 → 70 ÷ 7, 21 ÷ 7).
 */
function buildDivision(spec: LevelSpec, rng: () => number): Operands {
    const { min, max } = spec.divisionQuotient ?? { min: 2, max: 9 };
    const b = randInt(rng, 2, 9);
    const q = randInt(rng, min, max);
    return { a: b * q, b };
}

function buildOperands(
    op: Operation,
    spec: LevelSpec,
    rng: () => number
): Operands {
    switch (op) {
        case "addition":
            return buildAddition(spec, rng);
        case "subtraction":
            return buildSubtraction(spec, rng);
        case "multiplication":
            return buildMultiplication(spec, rng);
        case "division":
            return buildDivision(spec, rng);
    }
}

export interface GenerateLeveledQuestionOptions {
    /** Last question key to avoid (`"a+b"` form). */
    lastQuestionKey?: string;
    /** Override RNG for deterministic tests. Returns a number in [0, 1). */
    rng?: () => number;
    /** Max attempts to avoid the `lastQuestionKey` before giving up. */
    maxAttempts?: number;
}

/**
 * Generate a question that satisfies the given level's curriculum: a permitted
 * operation with an integer answer inside the level's answer range.
 */
export function generateLeveledQuestion(
    level: number,
    options: GenerateLeveledQuestionOptions = {}
): Question {
    const { lastQuestionKey, rng = Math.random, maxAttempts = 50 } = options;
    const spec = getLevelSpec(level);

    let attempts = 0;
    let question: Question;
    do {
        const op = spec.operations[randInt(rng, 0, spec.operations.length - 1)];
        const { a, b } = buildOperands(op, spec, rng);
        const answer = compute(op, a, b);
        question = {
            input1: a,
            input2: b,
            operator: OPERATORS[op],
            answer,
            hint: generateHint(answer, op, a, b),
        };
        attempts++;
    } while (
        attempts < maxAttempts &&
        lastQuestionKey !== undefined &&
        questionKey(question) === lastQuestionKey
    );

    return question;
}
