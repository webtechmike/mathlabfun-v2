/**
 * Outerspace backdrop. Replaces v1's SCSS-generated star field with a single
 * fixed element painted with several radial-gradients. Cheap and crisp.
 */
export function OuterspaceBackground() {
    return (
        <div
            aria-hidden="true"
            className="bg-space-900 pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        >
            <div
                className="absolute inset-[-50%] animate-[spin_500s_linear_infinite]"
                style={{
                    backgroundImage: [
                        "radial-gradient(1px 1px at 5% 12%, rgba(255,255,255,0.85), transparent 60%)",
                        "radial-gradient(1px 1px at 22% 78%, rgba(255,255,255,0.6), transparent 60%)",
                        "radial-gradient(1.5px 1.5px at 38% 30%, rgba(255,255,255,0.7), transparent 60%)",
                        "radial-gradient(1px 1px at 55% 60%, rgba(255,255,255,0.5), transparent 60%)",
                        "radial-gradient(1px 1px at 70% 18%, rgba(255,255,255,0.7), transparent 60%)",
                        "radial-gradient(1.5px 1.5px at 82% 84%, rgba(255,255,255,0.6), transparent 60%)",
                        "radial-gradient(1px 1px at 12% 92%, rgba(255,255,255,0.5), transparent 60%)",
                        "radial-gradient(1px 1px at 88% 42%, rgba(255,255,255,0.6), transparent 60%)",
                        "radial-gradient(1.2px 1.2px at 47% 88%, rgba(255,255,255,0.7), transparent 60%)",
                        "radial-gradient(1px 1px at 65% 8%, rgba(255,255,255,0.6), transparent 60%)",
                    ].join(","),
                }}
            />
        </div>
    );
}
