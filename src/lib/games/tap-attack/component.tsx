"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faLightbulb,
    faLock,
    faLockOpen,
    faRocket,
} from "@fortawesome/free-solid-svg-icons";
import { Spaceship } from "@/components/Spaceship";
import { GameControlsPortal } from "@/components/GameHeaderPortal";
import { cn } from "@/lib/utils";
import {
    GameLayout,
    GameStatusHeader,
    GameTimer,
    PausedPanel,
} from "../shared/ui";
import { buildNumberBond, questionKey } from "../shared/question";
import type { NumberBond } from "../shared/question";
import {
    LEVELS,
    generateLeveledQuestion,
    getLevelSpec,
    MAX_LEVEL,
} from "../shared/levels";
import { calculateTapReward, generateChoices } from "./rules";
import type { GameComponentProps, Question } from "../types";

const CORRECT_ADVANCE_MS = 600;
const LEVEL_UP_ADVANCE_MS = 1500;
const WRONG_ADVANCE_MS = 1400;
/** Correct answers needed at a level before advancing to the next one. */
const CORRECT_TO_ADVANCE = 10;

type Feedback =
    | { kind: "idle" }
    | { kind: "correct"; choice: number }
    | { kind: "wrong"; choice: number };

export function TapAttack({ level: initialLevel }: GameComponentProps) {
    const [level, setLevel] = useState(initialLevel);
    const [pinned, setPinned] = useState(false);
    const [correctAtLevel, setCorrectAtLevel] = useState(0);
    const [levelUpTo, setLevelUpTo] = useState<number | null>(null);
    const [question, setQuestion] = useState<Question | null>(null);
    const [choices, setChoices] = useState<number[]>([]);
    const [showHint, setShowHint] = useState(false);
    const [eliminated, setEliminated] = useState<number[]>([]);
    const [paused, setPaused] = useState(false);
    const [feedback, setFeedback] = useState<Feedback>({ kind: "idle" });
    const [scoreStreak, setScoreStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [spacebucks, setSpacebucks] = useState(0);
    const [timeLeft, setTimeLeft] = useState(
        () => getLevelSpec(initialLevel).roundSeconds
    );
    const lastKeyRef = useRef<string | undefined>(undefined);
    const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // The generator and timer callbacks read the level from a ref so they
    // always use the latest value even when scheduled before a re-render.
    const levelRef = useRef(level);

    const startNewQuestion = useCallback(() => {
        if (advanceTimerRef.current) {
            clearTimeout(advanceTimerRef.current);
            advanceTimerRef.current = null;
        }
        const lvl = levelRef.current;
        const spec = getLevelSpec(lvl);
        const next = generateLeveledQuestion(lvl, {
            lastQuestionKey: lastKeyRef.current,
        });
        lastKeyRef.current = questionKey(next);
        setQuestion(next);
        setChoices(
            generateChoices({
                question: next,
                count: spec.choiceCount,
                minAnswer: spec.minAnswer,
                maxAnswer: spec.maxAnswer,
            })
        );
        setFeedback({ kind: "idle" });
        setShowHint(false);
        setEliminated([]);
        setLevelUpTo(null);
        setTimeLeft(spec.roundSeconds);
    }, []);

    useEffect(() => {
        if (!question) startNewQuestion();
    }, [question, startNewQuestion]);

    // Countdown — frozen while feedback is showing (so kids aren't penalised by
    // the auto-advance delay) or while the player has paused for a break. On
    // timeout, only reset the streak when the level isn't "forgiving".
    useEffect(() => {
        if (!question || feedback.kind !== "idle" || paused) return;
        const id = setTimeout(() => {
            if (timeLeft <= 1) {
                const spec = getLevelSpec(levelRef.current);
                if (!spec.forgivingTimeout) setScoreStreak(0);
                startNewQuestion();
            } else {
                setTimeLeft((t) => t - 1);
            }
        }, 1000);
        return () => clearTimeout(id);
    }, [timeLeft, question, feedback, paused, startNewQuestion]);

    useEffect(() => {
        return () => {
            if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
        };
    }, []);

    const goToLevel = (newLevel: number) => {
        const clamped = Math.min(Math.max(1, newLevel), MAX_LEVEL);
        levelRef.current = clamped;
        setLevel(clamped);
        setCorrectAtLevel(0);
        setScoreStreak(0);
        setPaused(false);
        startNewQuestion();
    };

    const onChoose = (choice: number) => {
        if (!question || feedback.kind !== "idle" || paused) return;
        if (eliminated.includes(choice)) return;

        if (choice === question.answer) {
            const reward = calculateTapReward({
                operation: question.operator.label,
                isSuperStreakActive: false,
                question,
                level,
                helpUsed: showHint || eliminated.length > 0,
            });
            const nextStreak = scoreStreak + 1;
            setScoreStreak(nextStreak);
            setBestStreak((b) => Math.max(b, nextStreak));
            setSpacebucks((s) => s + reward);
            setFeedback({ kind: "correct", choice });

            let advanceMs = CORRECT_ADVANCE_MS;
            if (!pinned) {
                const nextCount = correctAtLevel + 1;
                if (
                    nextCount >= CORRECT_TO_ADVANCE &&
                    levelRef.current < MAX_LEVEL
                ) {
                    const newLevel = levelRef.current + 1;
                    levelRef.current = newLevel;
                    setLevel(newLevel);
                    setCorrectAtLevel(0);
                    setLevelUpTo(newLevel);
                    advanceMs = LEVEL_UP_ADVANCE_MS;
                } else {
                    setCorrectAtLevel(nextCount);
                }
            }
            advanceTimerRef.current = setTimeout(startNewQuestion, advanceMs);
        } else {
            setScoreStreak(0);
            setFeedback({ kind: "wrong", choice });
            advanceTimerRef.current = setTimeout(
                startNewQuestion,
                WRONG_ADVANCE_MS
            );
        }
    };

    // Leave at least the answer and one wrong choice on the board.
    const maxEliminations = Math.max(0, choices.length - 2);

    // Progressive help: first press reveals the hint, further presses gray out
    // a wrong choice (the "50/50" lifeline) until we hit the cap.
    const onHelp = () => {
        if (!question || feedback.kind !== "idle") return;
        if (!showHint) {
            setShowHint(true);
            return;
        }
        setEliminated((prev) => {
            if (prev.length >= maxEliminations) return prev;
            const candidates = choices.filter(
                (c) => c !== question.answer && !prev.includes(c)
            );
            if (candidates.length === 0) return prev;
            const pick =
                candidates[Math.floor(Math.random() * candidates.length)];
            return [...prev, pick];
        });
    };

    if (!question) return null;

    const spec = getLevelSpec(level);
    const atMaxLevel = level >= MAX_LEVEL;
    const progressPct = Math.round((correctAtLevel / CORRECT_TO_ADVANCE) * 100);

    const gridCols = choices.length === 3 ? "grid-cols-3" : "grid-cols-2";

    const numberBond =
        question.operator.label === "division"
            ? buildNumberBond(question.input1, question.input2)
            : null;

    const canEliminate = showHint && eliminated.length < maxEliminations;
    const helpExhausted = showHint && !canEliminate;
    const helpTitle = !showHint
        ? "Show a hint"
        : canEliminate
          ? "Remove a wrong answer"
          : "No more help";

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
                        htmlFor="level-select"
                        className="text-sm tracking-wide uppercase opacity-80"
                    >
                        Level
                    </label>
                    <select
                        id="level-select"
                        value={level}
                        onChange={(e) => goToLevel(Number(e.target.value))}
                        className="bg-space-800/80 ring-space-100/20 focus:ring-spacebucks rounded-lg px-3 py-2 text-sm ring-1 transition outline-none focus:ring-2"
                    >
                        {LEVELS.map((l) => (
                            <option key={l.level} value={l.level}>
                                {l.level} — {l.label}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={() => setPinned((p) => !p)}
                        aria-pressed={pinned}
                        title={
                            pinned
                                ? "Unlock to resume level progression"
                                : "Lock to stay on this level"
                        }
                        className={cn(
                            "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium ring-1 transition",
                            pinned
                                ? "bg-spacebucks/20 ring-spacebucks text-spacebucks"
                                : "bg-space-800/70 ring-space-100/20 hover:ring-spacebucks/60"
                        )}
                    >
                        <FontAwesomeIcon icon={pinned ? faLock : faLockOpen} />
                        {pinned ? "Locked" : "Lock"}
                    </button>
                </div>
            </GameControlsPortal>

            <GameTimer
                timeLeft={timeLeft}
                paused={paused}
                onTogglePause={() => setPaused((p) => !p)}
                pauseDisabled={feedback.kind !== "idle"}
            />

            <div className="w-full">
                <div className="mb-1 flex justify-between text-xs opacity-70">
                    <span>{spec.label}</span>
                    <span>
                        {pinned
                            ? "Locked on this level"
                            : atMaxLevel
                              ? "Max level reached"
                              : `${correctAtLevel}/${CORRECT_TO_ADVANCE} to level ${level + 1}`}
                    </span>
                </div>
                <div className="bg-space-800/70 ring-space-100/10 h-2 w-full overflow-hidden rounded-full ring-1">
                    <div
                        className={cn(
                            "h-full transition-all duration-300",
                            pinned ? "bg-space-100/30" : "bg-spacebucks"
                        )}
                        style={{
                            width: `${pinned || atMaxLevel ? 100 : progressPct}%`,
                        }}
                    />
                </div>
            </div>

            {levelUpTo !== null && (
                <div className="bg-correct/20 ring-correct text-correct flex items-center gap-2 rounded-xl px-4 py-2 font-semibold ring-1">
                    <FontAwesomeIcon icon={faRocket} />
                    Level up! Now level {levelUpTo}
                </div>
            )}

            <Spaceship />

            {paused ? (
                <PausedPanel onResume={() => setPaused(false)}>
                    {showHint && (
                        <>
                            <h1 className="text-5xl font-bold tracking-wide">
                                {question.input1} {question.operator.symbol}{" "}
                                {question.input2}
                            </h1>
                            {numberBond ? (
                                <NumberBondHint bond={numberBond} />
                            ) : (
                                <div className="text-spacebucks-soft text-sm">
                                    Hint: {question.hint}
                                </div>
                            )}
                        </>
                    )}
                </PausedPanel>
            ) : (
                <div className="flex w-full flex-col items-center gap-6">
                    <div className="flex items-center gap-3">
                        <h1 className="text-5xl font-bold tracking-wide">
                            {question.input1} {question.operator.symbol}{" "}
                            {question.input2}
                        </h1>
                        <button
                            type="button"
                            onClick={onHelp}
                            disabled={feedback.kind !== "idle" || helpExhausted}
                            className="text-spacebucks/80 hover:text-spacebucks text-2xl transition disabled:opacity-30"
                            aria-label={helpTitle}
                            title={helpTitle}
                        >
                            <FontAwesomeIcon icon={faLightbulb} />
                        </button>
                    </div>

                    {showHint &&
                        (numberBond ? (
                            <NumberBondHint bond={numberBond} />
                        ) : (
                            <div className="text-spacebucks-soft text-sm">
                                Hint: {question.hint}
                            </div>
                        ))}

                    <div className={cn("grid w-full gap-3", gridCols)}>
                        {choices.map((choice) => {
                            const isAnswerReveal =
                                feedback.kind !== "idle" &&
                                choice === question.answer;
                            const isWrongPick =
                                feedback.kind === "wrong" &&
                                feedback.choice === choice;
                            const isEliminated = eliminated.includes(choice);
                            return (
                                <button
                                    key={choice}
                                    type="button"
                                    disabled={
                                        feedback.kind !== "idle" || isEliminated
                                    }
                                    onClick={() => onChoose(choice)}
                                    className={cn(
                                        "bg-space-800/70 ring-space-100/20 rounded-2xl px-4 py-6 text-3xl font-bold ring-1 transition",
                                        "enabled:hover:bg-space-700/80 enabled:hover:ring-spacebucks/60",
                                        "disabled:cursor-not-allowed",
                                        isAnswerReveal &&
                                            "bg-correct/25 ring-correct text-correct ring-2",
                                        isWrongPick &&
                                            "bg-critical/25 ring-critical text-critical ring-2",
                                        isEliminated &&
                                            "text-space-100/30 line-through opacity-40"
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
                                Answer: {question.answer}
                            </span>
                        )}
                    </div>
                </div>
            )}
        </GameLayout>
    );
}

/**
 * Renders a division number bond: the dividend at the top splitting into two
 * round-tens parts, each shown as an easy division. We deliberately stop short
 * of summing the two quotients so the learner does the final add themselves.
 */
function NumberBondHint({ bond }: { bond: NumberBond }) {
    const parts: Array<{ part: number; quotient: number }> = [
        { part: bond.part1, quotient: bond.quotient1 },
        { part: bond.part2, quotient: bond.quotient2 },
    ];

    return (
        <div
            className="bg-space-800/60 ring-spacebucks/30 flex flex-col items-center gap-3 rounded-2xl px-6 py-4 ring-1"
            role="status"
            aria-live="polite"
        >
            <span className="text-spacebucks-soft text-xs tracking-wide uppercase opacity-80">
                Number bond hint
            </span>
            <div className="flex flex-col items-center">
                <div className="bg-spacebucks/20 ring-spacebucks text-spacebucks flex h-14 w-14 items-center justify-center rounded-full text-xl font-bold ring-1">
                    {bond.dividend}
                </div>
                <svg
                    width="160"
                    height="26"
                    viewBox="0 0 160 26"
                    className="text-spacebucks/40"
                    aria-hidden="true"
                >
                    <line
                        x1="80"
                        y1="0"
                        x2="40"
                        y2="26"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                    <line
                        x1="80"
                        y1="0"
                        x2="120"
                        y2="26"
                        stroke="currentColor"
                        strokeWidth="2"
                    />
                </svg>
                <div className="flex gap-10">
                    {parts.map(({ part, quotient }) => (
                        <div
                            key={part}
                            className="flex flex-col items-center gap-1"
                        >
                            <div className="bg-space-700/70 ring-spacebucks/40 text-space-100 flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold ring-1">
                                {part}
                            </div>
                            <span className="text-spacebucks-soft text-sm font-medium tabular-nums">
                                {part} ÷ {bond.divisor} = {quotient}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
            <span className="text-space-100/70 text-xs">
                Add the two answers together.
            </span>
        </div>
    );
}
