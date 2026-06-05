import type { GameModule } from "../types";
import { TimesTableGrid } from "./component";

const timesTableGrid: GameModule = {
    meta: {
        slug: "times-table-grid",
        title: "Times Table Grid",
        tagline: "Fill the faded squares. Tap to play.",
        description:
            "An interactive multiplication grid that grows from 5×5 up to 15×15. Some products fade out — tap a blank square and pick the right answer from four options to fill the table back in and build times-table fluency.",
    },
    Component: TimesTableGrid,
};

export default timesTableGrid;
