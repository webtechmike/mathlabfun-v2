import { notFound } from "next/navigation";
import { getGame, listGames } from "@/lib/games/registry";

interface PageProps {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ level?: string }>;
}

export async function generateStaticParams() {
    return listGames().map((g) => ({ slug: g.meta.slug }));
}

export async function generateMetadata({ params }: PageProps) {
    const { slug } = await params;
    const game = getGame(slug);
    if (!game) return { title: "Game not found" };
    return {
        title: `${game.meta.title} · Mathlab.fun`,
        description: game.meta.description,
    };
}

export default async function GamePage({ params, searchParams }: PageProps) {
    const [{ slug }, { level }] = await Promise.all([params, searchParams]);
    const game = getGame(slug);
    if (!game) notFound();

    const numericLevel = Number(level ?? 1) || 1;
    const Component = game.Component;
    return <Component level={numericLevel} />;
}
