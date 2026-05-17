import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicEnv } from "./env";
import type { Database } from "./types";

export async function createClient() {
    const cookieStore = await cookies();
    const { url, anonKey } = getSupabasePublicEnv();

    return createServerClient<Database>(url, anonKey, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        cookieStore.set(name, value, options);
                    });
                } catch {
                    // The `set` call from a Server Component will throw; that
                    // is safe to ignore as long as middleware refreshes the
                    // session on every request.
                }
            },
        },
    });
}
