"use client";

import { faMeteor } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface SpacebucksIconProps {
    showTooltip?: boolean;
    className?: string;
}

export function SpacebucksIcon({
    showTooltip: enableTooltip = false,
    className,
}: SpacebucksIconProps) {
    if (!enableTooltip) {
        return (
            <span
                className={cn(
                    "text-spacebucks animate-glow text-2xl",
                    className
                )}
            >
                <FontAwesomeIcon icon={faMeteor} />
            </span>
        );
    }
    return <SpacebucksIconWithPopup className={className} />;
}

function SpacebucksIconWithPopup({ className }: { className?: string }) {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const popupRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const onPointerDown = (event: MouseEvent) => {
            const target = event.target as Node;
            if (
                !triggerRef.current?.contains(target) &&
                !popupRef.current?.contains(target)
            ) {
                setOpen(false);
            }
        };
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") setOpen(false);
        };
        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                aria-haspopup="dialog"
                aria-expanded={open}
                aria-label="Show spacebucks rewards"
                className={cn(
                    "text-spacebucks animate-glow text-2xl transition hover:brightness-110",
                    className
                )}
            >
                <FontAwesomeIcon icon={faMeteor} />
            </button>

            {open && (
                <div
                    ref={popupRef}
                    role="dialog"
                    aria-label="Spacebucks rewards"
                    className="bg-space-800/95 ring-spacebucks/30 fixed top-[max(6rem,calc(env(safe-area-inset-top)+5rem))] left-1/2 z-30 max-h-[calc(100vh-8rem)] w-80 max-w-[calc(100vw-2rem)] -translate-x-1/2 overflow-y-auto rounded-xl p-4 text-left text-sm shadow-2xl ring-1 backdrop-blur"
                >
                    <h3 className="text-spacebucks mb-2 font-semibold">
                        Spacebucks rewards
                    </h3>
                    <ul className="space-y-1">
                        <li className="flex justify-between">
                            <span>+ Addition</span>
                            <span className="text-spacebucks-soft">1</span>
                        </li>
                        <li className="flex justify-between">
                            <span>− Subtraction</span>
                            <span className="text-spacebucks-soft">2</span>
                        </li>
                        <li className="flex justify-between">
                            <span>× Multiplication</span>
                            <span className="text-spacebucks-soft">3</span>
                        </li>
                        <li className="flex justify-between">
                            <span>Negative result</span>
                            <span className="text-spacebucks-soft">+1</span>
                        </li>
                        <li className="flex justify-between">
                            <span>Per 2 levels</span>
                            <span className="text-spacebucks-soft">+1</span>
                        </li>
                    </ul>
                    <p className="mt-3 text-xs opacity-80">
                        Login 3+ days in a row to <strong>double</strong> all
                        rewards.
                    </p>
                </div>
            )}
        </>
    );
}
