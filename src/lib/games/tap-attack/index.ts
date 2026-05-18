import type { GameModule } from "../types";
import { TapAttack } from "./component";

const tapAttack: GameModule = {
    meta: {
        slug: "tap-attack",
        title: "Tap Attack",
        tagline: "Tap the right answer. Mobile-friendly.",
        description:
            "Multiple-choice math drill optimized for mobile. Tap the correct answer from 3 or 4 options — no keyboard required. Rewards are half of Math Attack since recognition is easier than recall.",
    },
    Component: TapAttack,
};

export default tapAttack;
