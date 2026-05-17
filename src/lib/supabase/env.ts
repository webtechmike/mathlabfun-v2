/**
 * Read Supabase env vars and fail fast in non-build contexts when they're
 * missing. Centralised so the error message is the same everywhere.
 */
export function getSupabasePublicEnv(): {
    url: string;
    anonKey: string;
} {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) {
        throw new Error(
            "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env.local and fill in your Supabase project credentials."
        );
    }
    return { url, anonKey };
}
