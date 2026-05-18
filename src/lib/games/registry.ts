import type { GameModule } from "./types";
import mathAttack from "./math-attack";
import tapAttack from "./tap-attack";

const games = {
    [mathAttack.meta.slug]: mathAttack,
    [tapAttack.meta.slug]: tapAttack,
} satisfies Record<string, GameModule>;

export type GameSlug = keyof typeof games;

export function getGame(slug: string): GameModule | undefined {
    return (games as Record<string, GameModule>)[slug];
}

export function listGames(): GameModule[] {
    return Object.values(games);
}
