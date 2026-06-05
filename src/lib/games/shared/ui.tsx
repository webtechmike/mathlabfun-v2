"use client";

import type { ReactNode } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faClock,
    faFireFlameCurved,
    faPause,
    faPlay,
    faRocket,
} from "@fortawesome/free-solid-svg-icons";
import { GameHeaderPortal } from "@/components/GameHeaderPortal";
import { cn } from "@/lib/utils";

/**
 * Outer shell shared by every game. Centers play within the viewport and leaves
 * top room for the fixed header (status) and the controls slot beneath it.
 */
export function GameLayout({ children }: { children: ReactNode }) {
    return (
        <div className="relative mx-auto flex w-full max-w-2xl flex-col items-center gap-8 px-4 pt-24 pb-8">
            {children}
        </div>
    );
}

/**
 * In-game status (optional level, streak/best, spacebucks) rendered into the
 * fixed app header so it stays out of the play area but visible during play.
 */
export function GameStatusHeader({
    level,
    streak,
    bestStreak,
    spacebucks,
}: {
    level?: number;
    streak: number;
    bestStreak: number;
    spacebucks: number;
}) {
    return (
        <GameHeaderPortal>
            <div className="flex items-center gap-4 text-sm sm:gap-6">
                {level !== undefined && (
                    <div className="flex items-center gap-2">
                        <FontAwesomeIcon
                            icon={faRocket}
                            className="text-spacebucks"
                        />
                        <span className="hidden tracking-wide uppercase opacity-70 sm:inline">
                            Level
                        </span>
                        <span className="text-xl font-bold">{level}</span>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <FontAwesomeIcon
                        icon={faFireFlameCurved}
                        className="text-streak"
                    />
                    <span className="text-xl font-bold">{streak}</span>
                    <span className="text-xs opacity-60">
                        Best {bestStreak}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="hidden opacity-70 sm:inline">
                        Spacebucks
                    </span>
                    <span className="text-spacebucks font-semibold">
                        {spacebucks}
                    </span>
                </div>
            </div>
        </GameHeaderPortal>
    );
}

/** Color the countdown by urgency: red under 10s, amber under 15s. */
export function timerTone(timeLeft: number) {
    return timeLeft <= 10
        ? "text-critical"
        : timeLeft <= 15
          ? "text-warning"
          : "text-space-100";
}

/** Countdown clock plus a Pause/Resume toggle, shared across games. */
export function GameTimer({
    timeLeft,
    paused,
    onTogglePause,
    pauseDisabled = false,
}: {
    timeLeft: number;
    paused: boolean;
    onTogglePause: () => void;
    pauseDisabled?: boolean;
}) {
    return (
        <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faClock} />
            <span
                className={cn(
                    "text-2xl font-bold tabular-nums",
                    timerTone(timeLeft)
                )}
            >
                {timeLeft}s
            </span>
            <button
                type="button"
                onClick={onTogglePause}
                disabled={pauseDisabled}
                aria-pressed={paused}
                title={paused ? "Resume" : "Pause the timer"}
                className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium ring-1 transition disabled:opacity-30",
                    paused
                        ? "bg-spacebucks/20 ring-spacebucks text-spacebucks"
                        : "bg-space-800/70 ring-space-100/20 hover:ring-spacebucks/60"
                )}
            >
                <FontAwesomeIcon icon={paused ? faPlay : faPause} />
                {paused ? "Resume" : "Pause"}
            </button>
        </div>
    );
}

/**
 * The paused overlay. `children` holds the (optional) game-specific hint shown
 * while paused; the badge, reassurance copy, and Resume button are shared.
 */
export function PausedPanel({
    onResume,
    children,
}: {
    onResume: () => void;
    children?: ReactNode;
}) {
    return (
        <div className="bg-space-800/60 ring-spacebucks/30 flex w-full flex-col items-center gap-4 rounded-2xl px-6 py-10 text-center ring-1">
            <div className="text-spacebucks flex items-center gap-2 text-sm font-semibold tracking-wide uppercase">
                <FontAwesomeIcon icon={faPause} />
                Paused
            </div>
            {children}
            <p className="text-space-100/70 text-sm">
                Take your time — the timer is stopped.
            </p>
            <button
                type="button"
                onClick={onResume}
                className="bg-spacebucks text-space-900 mt-2 flex items-center gap-2 rounded-lg px-5 py-2 text-lg font-semibold transition hover:brightness-110"
            >
                <FontAwesomeIcon icon={faPlay} />
                Resume
            </button>
        </div>
    );
}
