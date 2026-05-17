import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listGames } from "@/lib/games/registry";
import { SpacebucksIcon } from "@/components/SpacebucksIcon";

export default async function HomePage() {
    let isLoggedIn = false;
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        isLoggedIn = Boolean(user);
    } catch {
        // Supabase not configured yet.
    }

    const games = listGames();

    return (
        <div className="flex w-full max-w-2xl flex-col items-center gap-10 text-center">
            <div className="flex items-center gap-3">
                <SpacebucksIcon />
                <h1 className="text-4xl font-bold sm:text-5xl">
                    Earn Spacebucks
                </h1>
            </div>
            <p className="max-w-prose text-lg opacity-80">
                Solve math problems, build a daily streak, and unlock double
                rewards after three days in a row.
            </p>

            <div className="grid w-full gap-4 sm:grid-cols-2">
                {games.map((game) => (
                    <Link
                        key={game.meta.slug}
                        href={`/games/${game.meta.slug}`}
                        className="bg-space-800/60 ring-space-100/10 hover:ring-spacebucks/60 flex flex-col gap-2 rounded-2xl p-6 text-left ring-1 backdrop-blur transition"
                    >
                        <h2 className="text-2xl font-semibold">
                            {game.meta.title}
                        </h2>
                        <p className="text-sm opacity-80">
                            {game.meta.tagline}
                        </p>
                    </Link>
                ))}
            </div>

            {!isLoggedIn && (
                <Link
                    href="/login"
                    className="bg-spacebucks text-space-900 rounded-lg px-6 py-3 font-semibold transition hover:brightness-110"
                >
                    Sign in to start tracking streaks
                </Link>
            )}
        </div>
    );
}
