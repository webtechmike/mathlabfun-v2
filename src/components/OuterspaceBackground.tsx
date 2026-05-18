/**
 * Outerspace backdrop. A single 1px dot multiplied with many box-shadows is
 * the standard render-reliable starfield technique — but only if each
 * shadow has nonzero spread. With spread:0 a 1px shadow at a fractional
 * vw/vh position gets anti-aliased across several sub-pixels and disappears.
 *
 * Star positions come from a seeded PRNG so SSR and CSR output match.
 */
const STARS = buildStarShadows({ count: 140, seed: 1337 });

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
        const tier = rand();
        const alpha = (0.55 + rand() * 0.45).toFixed(2);

        // Three star sizes for depth. Spread is what makes them visible.
        let spread: string;
        let blur = "0";
        if (tier < 0.7) {
            spread = "0.5px"; // small: ~2px star
        } else if (tier < 0.95) {
            spread = "1px"; // medium: ~3px star
        } else {
            spread = "1.5px"; // hero: ~4px star with halo
            blur = "6px";
        }

        shadows.push(
            `${x}vw ${y}vh ${blur} ${spread} rgba(255,255,255,${alpha})`
        );
    }
    return shadows.join(", ");
}
