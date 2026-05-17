import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicEnv } from "./env";
import type { Database } from "./types";

export function createClient() {
    const { url, anonKey } = getSupabasePublicEnv();
    return createBrowserClient<Database>(url, anonKey);
}
