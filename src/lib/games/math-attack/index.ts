import type { GameModule } from "../types";
import { MathAttack } from "./component";

const mathAttack: GameModule = {
    meta: {
        slug: "math-attack",
        title: "Math Attack",
        tagline: "Solve before time runs out.",
        description:
            "Drill addition, subtraction, and multiplication. Build a score streak, log in daily for a super streak, and earn spacebucks.",
    },
    Component: MathAttack,
};

export default mathAttack;
export * from "./rules";
