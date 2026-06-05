import { calculateReward } from "../shared/reward";

/**
 * The grid curriculum. Each level grows the multiplication table the learner
 * is working with and fades out more cells to fill back in:
 *
 *   1 →  5×5  grid, 5 faded cells   (gentle default view)
 *   2 →  8×8  grid, 10 faded cells
 *   3 → 10×10 grid, 14 faded cells
 *   4 → 12×12 grid, 18 faded cells
 *   5 → 15×15 grid, 24 faded cells
 *
 * `missing` is how many product cells start blank and must be tapped in. The
 * count is deliberately a fraction of the grid so larger tables stay solvable
 * in a single sitting rather than ballooning quadratically with size.
 */
export interface GridLevelSpec {
    level: number;
    /** Both dimensions of the square multiplication grid. */
    size: number;
    /** How many product cells start faded/blank for the player to fill in. */
    missing: number;
    /** Short human-readable description for the level chip. */
    label: string;
}

export const GRID_LEVELS: GridLevelSpec[] = [
    { level: 1, size: 5, missing: 5, label: "5 × 5 table" },
    { level: 2, size: 8, missing: 10, label: "8 × 8 table" },
    { level: 3, size: 10, missing: 14, label: "10 × 10 table" },
    { level: 4, size: 12, missing: 18, label: "12 × 12 table" },
    { level: 5, size: 15, missing: 24, label: "15 × 15 table" },
];

export const MAX_GRID_LEVEL = GRID_LEVELS.length;

/** Clamp any incoming level into the valid 1..MAX_GRID_LEVEL range. */
export function getGridLevel(level: number): GridLevelSpec {
    const clamped = Math.min(Math.max(1, Math.floor(level)), MAX_GRID_LEVEL);
    return GRID_LEVELS[clamped - 1];
}

export interface Cell {
    row: number;
    col: number;
}

/** Stable key for a 1-indexed grid cell, e.g. `"3x7"`. */
export function cellKey(row: number, col: number): string {
    return `${row}x${col}`;
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
 * Pick which product cells fade out for a round. We bias away from the first
 * row and first column (×1 is trivial), only falling back to them if a small
 * grid doesn't otherwise have enough interesting cells. Returned cells are
 * 1-indexed and unique.
 */
export function pickMissingCells(
    size: number,
    count: number,
    rng: () => number = Math.random
): Cell[] {
    const interesting: Cell[] = [];
    const trivial: Cell[] = [];
    for (let row = 1; row <= size; row++) {
        for (let col = 1; col <= size; col++) {
            if (row === 1 || col === 1) trivial.push({ row, col });
            else interesting.push({ row, col });
        }
    }

    const target = Math.min(count, size * size);
    const ordered = [...shuffled(interesting, rng), ...shuffled(trivial, rng)];
    return ordered.slice(0, target);
}

export interface GenerateProductChoicesOptions {
    row: number;
    col: number;
    /** Grid size, used to keep filler distractors in a believable range. */
    size: number;
    rng?: () => number;
}

/**
 * Build a 2×2 set of answer options for a faded cell. Distractors are
 * plausible times-table slips — adjacent products (off-by-a-row/column) and
 * off-by-one — so the choice tests recall instead of being a coin flip.
 *
 * Guarantees: exactly 4 distinct positive values, the true product included
 * once.
 */
export function generateProductChoices({
    row,
    col,
    size,
    rng = Math.random,
}: GenerateProductChoicesOptions): number[] {
    const product = row * col;
    const pool = new Set<number>([
        (row + 1) * col,
        (row - 1) * col,
        row * (col + 1),
        row * (col - 1),
        product + 1,
        product - 1,
        product + row,
        product - col,
    ]);
    pool.delete(product);

    const candidates = [...pool].filter((n) => n > 0);
    const distractors = shuffled(candidates, rng).slice(0, 3);

    const maxFiller = size * size;
    let safety = 80;
    while (distractors.length < 3 && safety-- > 0) {
        const filler = Math.max(1, Math.floor(rng() * maxFiller) + 1);
        if (filler !== product && !distractors.includes(filler)) {
            distractors.push(filler);
        }
    }

    return shuffled([...distractors, product], rng);
}

/**
 * Spacebucks earned per filled cell. Like Tap Attack, this is recognition
 * (multiple choice) rather than recall, so it pays half the canonical
 * multiplication reward, floored, minimum 1.
 */
export function calculateGridReward(level: number): number {
    const canonical = calculateReward({
        operation: "multiplication",
        isSuperStreakActive: false,
        level,
    });
    return Math.max(1, Math.floor(canonical / 2));
}
