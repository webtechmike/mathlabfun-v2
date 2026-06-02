"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClock, faFireFlameCurved } from "@fortawesome/free-solid-svg-icons";
import { Spaceship } from "@/components/Spaceship";
import { cn } from "@/lib/utils";
import { generateQuestion, questionKey } from "../shared/question";
import {
    calculateTapReward,
    choiceCountForLevel,
    generateChoices,
} from "./rules";
import type { GameComponentProps, Question } from "../types";

const ROUND_SECONDS = 30;
const CORRECT_ADVANCE_MS = 600;
const WRONG_ADVANCE_MS = 1400;

type Feedback =
    | { kind: "idle" }
    | { kind: "correct"; choice: number }
    | { kind: "wrong"; choice: number };

export function TapAttack({ level }: GameComponentProps) {
    const [question, setQuestion] = useState<Question | null>(null);
    const [choices, setChoices] = useState<number[]>([]);
    const [feedback, setFeedback] = useState<Feedback>({ kind: "idle" });
    const [scoreStreak, setScoreStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [spacebucks, setSpacebucks] = useState(0);
    const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
    const lastKeyRef = useRef<string | undefined>(undefined);
    const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const choiceCount = choiceCountForLevel(level);

    const startNewQuestion = useCallback(() => {
        if (advanceTimerRef.current) {
            clearTimeout(advanceTimerRef.current);
            advanceTimerRef.current = null;
        }
        const next = generateQuestion({ lastQuestionKey: lastKeyRef.current });
        lastKeyRef.current = questionKey(next);
        setQuestion(next);
        setChoices(generateChoices({ question: next, count: choiceCount }));
        setFeedback({ kind: "idle" });
        setTimeLeft(ROUND_SECONDS);
    }, [choiceCount]);

    useEffect(() => {
        if (!question) startNewQuestion();
    }, [question, startNewQuestion]);

    // Countdown — paused while feedback is showing so kids don't get
    // penalised by the auto-advance delay.
    useEffect(() => {
        if (!question || feedback.kind !== "idle") return;
        const id = setTimeout(() => {
            if (timeLeft <= 1) {
                setScoreStreak(0);
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
            advanceTimerRef.current = setTimeout(
                startNewQuestion,
                CORRECT_ADVANCE_MS
            );
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

    const timerTone =
        timeLeft <= 10
            ? "text-critical"
            : timeLeft <= 15
              ? "text-warning"
              : "text-space-100";

    const gridCols = choices.length === 3 ? "grid-cols-3" : "grid-cols-2";

    return (
        <div className="relative mx-auto flex w-full max-w-2xl flex-col items-center gap-8 px-4 py-8">
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
                        icon={faFireFlameCurved}
                        className="text-streak"
                    />
                    <span className="text-sm tracking-wide uppercase opacity-80">
                        Streak
                    </span>
                    <span className="text-2xl font-bold">{scoreStreak}</span>
                    <span className="ml-3 text-xs opacity-60">
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
