"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

/** DOM id of the header status slot rendered by the root layout. */
export const GAME_HEADER_SLOT_ID = "game-header-slot";
/** DOM id of the sub-header controls slot, pinned just below the header. */
export const GAME_CONTROLS_SLOT_ID = "game-controls-slot";

const subscribe = () => () => {};

/**
 * Renders `children` into a fixed layout slot identified by `slotId`. Reading
 * the slot via useSyncExternalStore keeps a stable snapshot (getElementById
 * returns the same node) and yields null on the server, so nothing portals
 * until the client takes over and the slot never leaks onto non-game pages.
 */
function SlotPortal({
    slotId,
    children,
}: {
    slotId: string;
    children: React.ReactNode;
}) {
    const slot = useSyncExternalStore(
        subscribe,
        () => document.getElementById(slotId),
        () => null
    );

    if (!slot) return null;
    return createPortal(children, slot);
}

/**
 * Surfaces in-game status (level, streak, spacebucks) in the fixed header while
 * keeping that markup colocated with the state that drives it.
 */
export function GameHeaderPortal({ children }: { children: React.ReactNode }) {
    return <SlotPortal slotId={GAME_HEADER_SLOT_ID}>{children}</SlotPortal>;
}

/**
 * Pins game controls (level selector, lock) just below the header, decoupled
 * from the vertically-centered play area so they sit close to the header with
 * clear separation from the gameplay below.
 */
export function GameControlsPortal({
    children,
}: {
    children: React.ReactNode;
}) {
    return <SlotPortal slotId={GAME_CONTROLS_SLOT_ID}>{children}</SlotPortal>;
}
