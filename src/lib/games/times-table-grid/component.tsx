"use client";

import { useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowRotateRight,
    faRocket,
} from "@fortawesome/free-solid-svg-icons";
import { GameControlsPortal } from "@/components/GameHeaderPortal";
import { cn } from "@/lib/utils";
import { GameLayout, GameStatusHeader } from "../shared/ui";
import type { GameComponentProps } from "../types";
import {
    calculateGridReward,
    cellKey,
    generateProductChoices,
    getGridLevel,
    GRID_LEVELS,
    MAX_GRID_LEVEL,
    pickMissingCells,
} from "./rules";

const CORRECT_FLASH_MS = 450;

type Feedback =
    | { kind: "idle" }
    | { kind: "correct" }
    | { kind: "wrong"; choice: number };

/**
 * Per-size display tuning. Bigger tables shrink the cell text and minimum
 * tappable width; the container scrolls horizontally on phones too narrow to
 * fit the larger grids at the minimum size.
 */
function gridMetrics(size: number): { text: string; minCell: number } {
    if (size <= 5) return { text: "text-base", minCell: 44 };
    if (size <= 8) return { text: "text-sm", minCell: 40 };
    if (size <= 10) return { text: "text-xs", minCell: 34 };
    if (size <= 12) return { text: "text-[11px]", minCell: 30 };
    return { text: "text-[10px]", minCell: 26 };
}

/** Build the set of faded (blank) cell keys for a fresh round at `lvl`. */
function freshMissing(lvl: number): Set<string> {
    const s = getGridLevel(lvl);
    const cells = pickMissingCells(s.size, s.missing);
    return new Set(cells.map((c) => cellKey(c.row, c.col)));
}

export function TimesTableGrid({ level: initialLevel }: GameComponentProps) {
    const startLevel = getGridLevel(initialLevel).level;
    const [level, setLevel] = useState(startLevel);
    const [missing, setMissing] = useState<Set<string>>(() =>
        freshMissing(startLevel)
    );
    const [solved, setSolved] = useState<Set<string>>(() => new Set());
    const [selected, setSelected] = useState<string | null>(null);
    const [choices, setChoices] = useState<number[]>([]);
    const [feedback, setFeedback] = useState<Feedback>({ kind: "idle" });
    const [scoreStreak, setScoreStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [spacebucks, setSpacebucks] = useState(0);

    const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const spec = getGridLevel(level);
    const size = spec.size;
    const totalMissing = missing.size + solved.size;
    const complete = totalMissing > 0 && missing.size === 0;

    /** Reset the board for `lvl` (defaults to the current level). */
    const startRound = (lvl: number = level) => {
        setLevel(lvl);
        setMissing(freshMissing(lvl));
        setSolved(new Set());
        setSelected(null);
        setChoices([]);
        setFeedback({ kind: "idle" });
    };

    useEffect(() => {
        return () => {
            if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
        };
    }, []);

    const onSelectCell = (row: number, col: number) => {
        const key = cellKey(row, col);
        if (!missing.has(key)) return;
        setSelected(key);
        setChoices(generateProductChoices({ row, col, size }));
        setFeedback({ kind: "idle" });
    };

    const onChoose = (choice: number) => {
        if (!selected || feedback.kind !== "idle") return;
        const [rowStr, colStr] = selected.split("x");
        const row = Number(rowStr);
        const col = Number(colStr);
        const product = row * col;

        if (choice === product) {
            const reward = calculateGridReward(level);
            const nextStreak = scoreStreak + 1;
            setScoreStreak(nextStreak);
            setBestStreak((b) => Math.max(b, nextStreak));
            setSpacebucks((s) => s + reward);
            setFeedback({ kind: "correct" });

            flashTimerRef.current = setTimeout(() => {
                setMissing((prev) => {
                    const next = new Set(prev);
                    next.delete(selected);
                    return next;
                });
                setSolved((prev) => new Set(prev).add(selected));
                setSelected(null);
                setChoices([]);
                setFeedback({ kind: "idle" });
            }, CORRECT_FLASH_MS);
        } else {
            setScoreStreak(0);
            setFeedback({ kind: "wrong", choice });
        }
    };

    const goToLevel = (newLevel: number) => {
        const clamped = Math.min(Math.max(1, newLevel), MAX_GRID_LEVEL);
        setScoreStreak(0);
        startRound(clamped);
    };

    const selectedCoords = selected
        ? (() => {
              const [r, c] = selected.split("x").map(Number);
              return { row: r, col: c };
          })()
        : null;

    const { text: cellText, minCell } = gridMetrics(size);
    const headers = Array.from({ length: size }, (_, i) => i + 1);
    const solvedCount = solved.size;

    return (
        <GameLayout>
            <GameStatusHeader
                level={level}
                streak={scoreStreak}
                bestStreak={bestStreak}
                spacebucks={spacebucks}
            />

            <GameControlsPortal>
                <div className="flex flex-wrap items-center justify-center gap-3">
                    <label
                        htmlFor="grid-level-select"
                        className="text-sm tracking-wide uppercase opacity-80"
                    >
                        Level
                    </label>
                    <select
                        id="grid-level-select"
                        value={level}
                        onChange={(e) => goToLevel(Number(e.target.value))}
                        className="bg-space-800/80 ring-space-100/20 focus:ring-spacebucks rounded-lg px-3 py-2 text-sm ring-1 transition outline-none focus:ring-2"
                    >
                        {GRID_LEVELS.map((l) => (
                            <option key={l.level} value={l.level}>
                                {l.level} — {l.label}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={() => startRound()}
                        title="Shuffle a fresh set of faded cells"
                        className="bg-space-800/70 ring-space-100/20 hover:ring-spacebucks/60 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ring-1 transition"
                    >
                        <FontAwesomeIcon icon={faArrowRotateRight} />
                        New grid
                    </button>
                </div>
            </GameControlsPortal>

            <div className="w-full text-center">
                <h1 className="text-2xl font-bold sm:text-3xl">
                    Times Table Grid
                </h1>
                <p className="mt-1 text-sm opacity-70">
                    Tap a faded square, then pick its product below.
                </p>
            </div>

            <div className="w-full">
                <div className="mb-1 flex justify-between text-xs opacity-70">
                    <span>{spec.label}</span>
                    <span>
                        {solvedCount}/{totalMissing} filled
                    </span>
                </div>
                <div className="bg-space-800/70 ring-space-100/10 h-2 w-full overflow-hidden rounded-full ring-1">
                    <div
                        className="bg-spacebucks h-full transition-all duration-300"
                        style={{
                            width: `${totalMissing ? (solvedCount / totalMissing) * 100 : 0}%`,
                        }}
                    />
                </div>
            </div>

            {complete && (
                <div className="bg-correct/20 ring-correct text-correct flex w-full flex-col items-center gap-3 rounded-2xl px-4 py-5 ring-1">
                    <div className="flex items-center gap-2 text-lg font-semibold">
                        <FontAwesomeIcon icon={faRocket} />
                        Grid complete!
                    </div>
                    <div className="flex flex-wrap justify-center gap-3">
                        <button
                            type="button"
                            onClick={() => startRound()}
                            className="bg-space-800/70 ring-space-100/20 hover:ring-spacebucks/60 text-space-100 rounded-lg px-4 py-2 text-sm font-medium ring-1 transition"
                        >
                            Play again
                        </button>
                        {level < MAX_GRID_LEVEL && (
                            <button
                                type="button"
                                onClick={() => goToLevel(level + 1)}
                                className="bg-spacebucks text-space-900 rounded-lg px-4 py-2 text-sm font-semibold transition hover:brightness-110"
                            >
                                Next level →
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className="w-full overflow-x-auto pb-2">
                <div
                    className="mx-auto grid gap-1"
                    style={{
                        gridTemplateColumns: `repeat(${size + 1}, minmax(${minCell}px, 1fr))`,
                        maxWidth: `${(size + 1) * (minCell + 8)}px`,
                    }}
                >
                    <HeaderCell text={cellText}>×</HeaderCell>
                    {headers.map((c) => (
                        <HeaderCell key={`col-${c}`} text={cellText}>
                            {c}
                        </HeaderCell>
                    ))}

                    {headers.map((row) => (
                        <GridRow key={`row-${row}`}>
                            <HeaderCell text={cellText}>{row}</HeaderCell>
                            {headers.map((col) => {
                                const key = cellKey(row, col);
                                const isMissing = missing.has(key);
                                const isSolved = solved.has(key);
                                const isSelected = selected === key;
                                return (
                                    <ProductCell
                                        key={key}
                                        text={cellText}
                                        product={row * col}
                                        isMissing={isMissing}
                                        isSolved={isSolved}
                                        isSelected={isSelected}
                                        onSelect={() => onSelectCell(row, col)}
                                    />
                                );
                            })}
                        </GridRow>
                    ))}
                </div>
            </div>

            {selectedCoords && (
                <div className="flex w-full flex-col items-center gap-4">
                    <div className="text-3xl font-bold tracking-wide">
                        {selectedCoords.row} × {selectedCoords.col} ={" "}
                        <span className="text-spacebucks">?</span>
                    </div>
                    <div className="grid w-full max-w-sm grid-cols-2 gap-3">
                        {choices.map((choice) => {
                            const product =
                                selectedCoords.row * selectedCoords.col;
                            const isAnswerReveal =
                                feedback.kind === "correct" &&
                                choice === product;
                            const isWrongPick =
                                feedback.kind === "wrong" &&
                                feedback.choice === choice;
                            return (
                                <button
                                    key={choice}
                                    type="button"
                                    disabled={feedback.kind === "correct"}
                                    onClick={() => onChoose(choice)}
                                    className={cn(
                                        "bg-space-800/70 ring-space-100/20 rounded-2xl px-4 py-6 text-3xl font-bold ring-1 transition",
                                        "enabled:hover:bg-space-700/80 enabled:hover:ring-spacebucks/60",
                                        "disabled:cursor-not-allowed",
                                        isAnswerReveal &&
                                            "bg-correct/25 ring-correct text-correct ring-2",
                                        isWrongPick &&
                                            "bg-critical/25 ring-critical text-critical ring-2"
                                    )}
                                >
                                    {choice}
                                </button>
                            );
                        })}
                    </div>
                    <div
                        className="h-6 text-sm"
                        role="status"
                        aria-live="polite"
                    >
                        {feedback.kind === "correct" && (
                            <span className="text-correct">Correct!</span>
                        )}
                        {feedback.kind === "wrong" && (
                            <span className="text-critical">
                                Try again — tap another option.
                            </span>
                        )}
                    </div>
                </div>
            )}

            {!selectedCoords && !complete && (
                <p className="text-sm opacity-60">
                    Tap any faded square to fill it in.
                </p>
            )}
        </GameLayout>
    );
}

function GridRow({ children }: { children: React.ReactNode }) {
    // Each row's cells live directly in the parent grid; this fragment keeps
    // the row header + cells grouped without an extra DOM wrapper.
    return <>{children}</>;
}

function HeaderCell({
    children,
    text,
}: {
    children: React.ReactNode;
    text: string;
}) {
    return (
        <div
            className={cn(
                "text-spacebucks/80 flex aspect-square items-center justify-center font-bold tabular-nums",
                text
            )}
        >
            {children}
        </div>
    );
}

function ProductCell({
    product,
    isMissing,
    isSolved,
    isSelected,
    onSelect,
    text,
}: {
    product: number;
    isMissing: boolean;
    isSolved: boolean;
    isSelected: boolean;
    onSelect: () => void;
    text: string;
}) {
    if (isMissing) {
        return (
            <button
                type="button"
                onClick={onSelect}
                aria-label="Fill in this product"
                className={cn(
                    "flex aspect-square items-center justify-center rounded-md font-bold tabular-nums ring-1 transition",
                    text,
                    isSelected
                        ? "bg-spacebucks/20 ring-spacebucks text-spacebucks ring-2"
                        : "bg-space-800/40 ring-spacebucks/30 hover:bg-space-700/60 hover:ring-spacebucks/60 text-spacebucks/40"
                )}
            >
                ?
            </button>
        );
    }

    return (
        <div
            className={cn(
                "flex aspect-square items-center justify-center rounded-md font-semibold tabular-nums ring-1",
                text,
                isSolved
                    ? "bg-correct/20 ring-correct/50 text-correct"
                    : "bg-space-800/60 ring-space-100/10 text-space-100/90"
            )}
        >
            {product}
        </div>
    );
}
