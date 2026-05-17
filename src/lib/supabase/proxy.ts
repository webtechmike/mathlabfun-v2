import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicEnv } from "./env";
import type { Database } from "./types";

/**
 * Refreshes the Supabase auth session on each request and forwards updated
 * cookies. Call from `middleware.ts`.
 */
export async function updateSession(request: NextRequest) {
    let response = NextResponse.next({ request });

    const { url, anonKey } = getSupabasePublicEnv();

    const supabase = createServerClient<Database>(url, anonKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) => {
                    request.cookies.set(name, value);
                });
                response = NextResponse.next({ request });
                cookiesToSet.forEach(({ name, value, options }) => {
                    response.cookies.set(name, value, options);
                });
            },
        },
    });

    await supabase.auth.getUser();

    return response;
}
