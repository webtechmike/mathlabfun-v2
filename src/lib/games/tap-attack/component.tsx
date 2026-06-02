"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faClock,
    faFireFlameCurved,
    faLock,
    faLockOpen,
    faRocket,
} from "@fortawesome/free-solid-svg-icons";
import { Spaceship } from "@/components/Spaceship";
import { cn } from "@/lib/utils";
import { questionKey } from "../shared/question";
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
        setLevelUpTo(null);
        setTimeLeft(spec.roundSeconds);
    }, []);

    useEffect(() => {
        if (!question) startNewQuestion();
    }, [question, startNewQuestion]);

    // Countdown — paused while feedback is showing so kids don't get
    // penalised by the auto-advance delay. On timeout, only reset the streak
    // when the level isn't "forgiving".
    useEffect(() => {
        if (!question || feedback.kind !== "idle") return;
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
    }, [timeLeft, question, feedback, startNewQuestion]);

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
        startNewQuestion();
    };

    const onChoose = (choice: number) => {
        if (!question || feedback.kind !== "idle") return;

        if (choice === question.answer) {
            const reward = calculateTapReward({
                operation: question.operator.label,
                isSuperStreakActive: false,
                question,
                level,
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

    if (!question) return null;

    const spec = getLevelSpec(level);
    const atMaxLevel = level >= MAX_LEVEL;
    const progressPct = Math.round((correctAtLevel / CORRECT_TO_ADVANCE) * 100);

    const timerTone =
        timeLeft <= 10
            ? "text-critical"
            : timeLeft <= 15
              ? "text-warning"
              : "text-space-100";

    const gridCols = choices.length === 3 ? "grid-cols-3" : "grid-cols-2";

    return (
        <div className="relative mx-auto flex w-full max-w-2xl flex-col items-center gap-6 px-4 py-8">
            <div className="flex w-full flex-wrap items-center justify-center gap-3">
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

            <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faClock} />
                <span
                    className={cn("text-2xl font-bold tabular-nums", timerTone)}
                >
                    {timeLeft}s
                </span>
            </div>

            <div className="bg-space-800/60 ring-streak/20 flex w-full items-center justify-between rounded-2xl px-4 py-3 ring-1 backdrop-blur">
                <div className="flex items-center gap-2">
                    <FontAwesomeIcon
                        icon={faRocket}
                        className="text-spacebucks"
                    />
                    <span className="text-sm tracking-wide uppercase opacity-80">
                        Level
                    </span>
                    <span className="text-2xl font-bold">{level}</span>
                </div>
                <div className="flex items-center gap-2">
                    <FontAwesomeIcon
                        icon={faFireFlameCurved}
                        className="text-streak"
                    />
                    <span className="text-2xl font-bold">{scoreStreak}</span>
                    <span className="ml-1 text-xs opacity-60">
                        Best {bestStreak}
                    </span>
                </div>
                <div className="text-sm opacity-80">
                    Spacebucks{" "}
                    <span className="text-spacebucks font-semibold">
                        {spacebucks}
                    </span>
                </div>
            </div>

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

            <div className="flex w-full flex-col items-center gap-6">
                <h1 className="text-5xl font-bold tracking-wide">
                    {question.input1} {question.operator.symbol}{" "}
                    {question.input2}
                </h1>

                <div className={cn("grid w-full gap-3", gridCols)}>
                    {choices.map((choice) => {
                        const isAnswerReveal =
                            feedback.kind !== "idle" &&
                            choice === question.answer;
                        const isWrongPick =
                            feedback.kind === "wrong" &&
                            feedback.choice === choice;
                        return (
                            <button
                                key={choice}
                                type="button"
                                disabled={feedback.kind !== "idle"}
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

                <div className="h-6 text-sm" role="status" aria-live="polite">
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
        </div>
    );
}
