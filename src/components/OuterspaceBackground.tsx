/**
 * Outerspace backdrop. A single 1px dot with many box-shadows is the
 * classic, render-reliable way to paint a star field — radial-gradient
 * stars at <2px tend to vanish into sub-pixel anti-aliasing.
 *
 * Star positions are generated from a fixed seed so server and client
 * markup always match.
 */
const STARS = buildStarShadows({ count: 120, seed: 1337 });

export function OuterspaceBackground() {
    return (
        <div
            aria-hidden="true"
            className="bg-space-900 pointer-events-none fixed inset-0 -z-10 overflow-hidden"
        >
            <div
                className="absolute top-0 left-0 h-px w-px rounded-full bg-white"
                style={{ boxShadow: STARS }}
            />
        </div>
    );
}

function buildStarShadows({
    count,
    seed,
}: {
    count: number;
    seed: number;
}): string {
    // Mulberry32: small deterministic PRNG. Same seed → identical output
    // on server and client, so React doesn't complain about hydration.
    let state = seed >>> 0;
    const rand = () => {
        state = (state + 0x6d2b79f5) >>> 0;
        let t = state;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };

    const shadows: string[] = [];
    for (let i = 0; i < count; i++) {
        const x = (rand() * 100).toFixed(2);
        const y = (rand() * 100).toFixed(2);
        const alpha = (0.35 + rand() * 0.55).toFixed(2);
        // ~5% of stars get a slight glow to add depth.
        const glow = rand() < 0.05 ? "4px" : "0";
        shadows.push(
            `${x}vw ${y}vh 0 0 rgba(255,255,255,${alpha})`,
            `${x}vw ${y}vh ${glow} 0 rgba(255,255,255,${alpha})`
        );
    }
    return shadows.join(", ");
}
