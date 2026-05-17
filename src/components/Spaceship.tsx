import { cn } from "@/lib/utils";

/**
 * Pure-CSS spaceship, ported from the v1 SCSS into Tailwind utilities.
 * Stack: helmet (dome) → cargo (body) → magnet (cone). Floats on hover.
 */
export function Spaceship({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                "animate-float flex flex-col items-center",
                className
            )}
            aria-hidden="true"
        >
            <div className="h-6 w-10 rounded-t-full bg-cyan-300/80 shadow-[0_0_12px_2px_rgba(34,211,238,0.6)]" />
            <div className="-mt-1 h-12 w-16 rounded-md bg-slate-200/90 shadow-[0_0_18px_2px_rgba(255,255,255,0.25)]" />
            <div
                className="h-6 w-10 bg-orange-400"
                style={{
                    clipPath: "polygon(0 0, 100% 0, 75% 100%, 25% 100%)",
                }}
            />
        </div>
    );
}
