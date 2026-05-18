"use client";

import { faUserAstronaut } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useRef, useState } from "react";
import { signOut } from "@/app/login/actions";

export function UserMenu() {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;

        function onPointerDown(event: MouseEvent) {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        }
        function onKey(event: KeyboardEvent) {
            if (event.key === "Escape") setOpen(false);
        }

        document.addEventListener("mousedown", onPointerDown);
        document.addEventListener("keydown", onKey);
        return () => {
            document.removeEventListener("mousedown", onPointerDown);
            document.removeEventListener("keydown", onKey);
        };
    }, [open]);

    return (
        <div ref={containerRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label="Account menu"
                title="Account"
                className="hover:text-spacebucks transition"
            >
                <FontAwesomeIcon icon={faUserAstronaut} size="2x" />
            </button>

            {open && (
                <div
                    role="menu"
                    aria-label="Account"
                    className="bg-space-800/95 ring-space-100/10 absolute top-full right-0 z-20 mt-3 w-40 overflow-hidden rounded-xl text-sm shadow-2xl ring-1 backdrop-blur"
                >
                    <form action={signOut}>
                        <button
                            type="submit"
                            role="menuitem"
                            className="hover:bg-space-700/80 hover:text-spacebucks block w-full px-4 py-2 text-left transition"
                        >
                            Sign out
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
