"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCircleQuestion,
    faClock,
    faFireFlameCurved,
} from "@fortawesome/free-solid-svg-icons";
import { Spaceship } from "@/components/Spaceship";
import { cn } from "@/lib/utils";
import { generateQuestion, questionKey } from "../shared/question";
import { calculateReward } from "../shared/reward";
import type { GameComponentProps, Question } from "../types";

const ROUND_SECONDS = 30;

export function MathAttack({ level }: GameComponentProps) {
    const [question, setQuestion] = useState<Question | null>(null);
    const [currentAnswer, setCurrentAnswer] = useState("");
    const [showHint, setShowHint] = useState(false);
    const [helpCount, setHelpCount] = useState(0);
    const [scoreStreak, setScoreStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);
    const [spacebucks, setSpacebucks] = useState(0);
    const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
    const lastKeyRef = useRef<string | undefined>(undefined);
    const inputRef = useRef<HTMLInputElement>(null);

    const startNewQuestion = useCallback(() => {
        const next = generateQuestion({ lastQuestionKey: lastKeyRef.current });
        lastKeyRef.current = questionKey(next);
        setQuestion(next);
        setCurrentAnswer("");
        setShowHint(false);
        setHelpCount(0);
        setTimeLeft(ROUND_SECONDS);
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        if (!question) startNewQuestion();
    }, [question, startNewQuestion]);

    useEffect(() => {
        if (!question) return;
        const id = setTimeout(() => {
            if (timeLeft <= 1) {
                setScoreStreak(0);
                startNewQuestion();
            } else {
                setTimeLeft((t) => t - 1);
            }
        }, 1000);
        return () => clearTimeout(id);
    }, [timeLeft, question, startNewQuestion]);

    if (!question) return null;

    const isCorrect =
        currentAnswer !== "" && Number(currentAnswer) === question.answer;

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isCorrect) {
            setScoreStreak(0);
            return;
        }
        const reward = calculateReward({
            operation: question.operator.label,
            isSuperStreakActive: false,
            question,
            level,
        });
        const nextStreak = scoreStreak + 1;
        setScoreStreak(nextStreak);
        setBestStreak((b) => Math.max(b, nextStreak));
        setSpacebucks((s) => s + reward);
        startNewQuestion();
    };

    const onHelp = () => {
        if (helpCount === 0) {
            setShowHint(true);
            setHelpCount(1);
        } else {
            setCurrentAnswer(String(question.answer));
            setHelpCount(0);
            inputRef.current?.focus();
        }
    };

    const timerTone =
        timeLeft <= 10
            ? "text-critical"
            : timeLeft <= 15
              ? "text-warning"
              : "text-space-100";

    return (
        <div className="relative mx-auto flex w-full max-w-2xl flex-col items-center gap-8 px-4 py-8">
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
                <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faClock} />
                    <span
                        className={cn(
                            "text-2xl font-bold tabular-nums",
                            timerTone
                        )}
                    >
                        {timeLeft}s
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

            <div className="flex w-full flex-col items-center gap-4">
                <div className="flex items-center gap-3">
                    <h1 className="text-5xl font-bold tracking-wide">
                        {question.input1} {question.operator.symbol}{" "}
                        {question.input2}
                    </h1>
                    <button
                        type="button"
                        onClick={onHelp}
                        className="hover:text-spacebucks text-2xl transition"
                        aria-label="Help"
                    >
                        <FontAwesomeIcon icon={faCircleQuestion} />
                    </button>
                </div>
                {showHint && (
                    <div className="text-spacebucks-soft text-sm">
                        Hint: {question.hint}
                    </div>
                )}

                <form onSubmit={onSubmit} className="flex items-center gap-2">
                    <label htmlFor="answer" className="sr-only">
                        Answer
                    </label>
                    <input
                        ref={inputRef}
                        id="answer"
                        type="number"
                        autoComplete="off"
                        autoFocus
                        value={currentAnswer}
                        onChange={(e) => setCurrentAnswer(e.target.value)}
                        className={cn(
                            "bg-space-800/70 ring-space-100/20 focus:ring-spacebucks w-32 rounded-lg px-3 py-2 text-center text-2xl ring-1 transition outline-none focus:ring-2",
                            isCorrect && "ring-correct text-correct"
                        )}
                    />
                    <button
                        type="submit"
                        disabled={!isCorrect}
                        className="bg-spacebucks text-space-900 disabled:bg-space-100/20 disabled:text-space-100/40 rounded-lg px-4 py-2 text-lg font-semibold transition hover:brightness-110 disabled:cursor-not-allowed"
                    >
                        NEXT
                    </button>
                </form>
            </div>
        </div>
    );
}
