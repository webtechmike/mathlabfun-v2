"use client";

import { faMeteor } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface SpacebucksIconProps {
    showTooltip?: boolean;
    className?: string;
}

export function SpacebucksIcon({
    showTooltip: enableTooltip = false,
    className,
}: SpacebucksIconProps) {
    const [open, setOpen] = useState(false);

    return (
        <div
            className={cn("relative inline-flex items-center", className)}
            onMouseEnter={() => enableTooltip && setOpen(true)}
            onMouseLeave={() => enableTooltip && setOpen(false)}
        >
            <span className="text-spacebucks animate-glow text-2xl">
                <FontAwesomeIcon icon={faMeteor} />
            </span>
            {enableTooltip && open && (
                <div
                    role="tooltip"
                    className="bg-space-800/95 ring-spacebucks/30 absolute top-full left-1/2 z-20 mt-3 w-72 -translate-x-1/2 rounded-xl p-4 text-left text-sm shadow-2xl ring-1 backdrop-blur"
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
        </div>
    );
}
