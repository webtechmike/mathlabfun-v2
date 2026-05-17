import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Next.js 16 proxy (formerly `middleware`). Refreshes the Supabase auth
 * session on each request so server components see a current user.
 */
export async function proxy(request: NextRequest) {
    return updateSession(request);
}

export const config = {
    matcher: [
        // Skip Next internals and static assets.
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
