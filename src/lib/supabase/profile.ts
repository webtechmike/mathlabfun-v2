import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Profile, ProfileUpdate } from "./types";

type Client = SupabaseClient<Database>;

export async function getProfile(
    supabase: Client,
    userId: string
): Promise<Profile | null> {
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();
    if (error) throw error;
    return data;
}

export async function updateProfile(
    supabase: Client,
    userId: string,
    patch: ProfileUpdate
): Promise<Profile> {
    const { data, error } = await supabase
        .from("profiles")
        .update(patch)
        .eq("id", userId)
        .select("*")
        .single();
    if (error) throw error;
    return data;
}

/**
 * Apply a daily streak rollover based on `last_login_date`. Mirrors the v1
 * logic but runs against Supabase.
 */
export async function tickDailyStreak(
    supabase: Client,
    userId: string
): Promise<Profile> {
    const profile = await getProfile(supabase, userId);
    if (!profile) {
        throw new Error(`profile ${userId} not found`);
    }

    const today = new Date().toDateString();
    const lastLogin = profile.last_login_date
        ? new Date(profile.last_login_date).toDateString()
        : null;
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

    if (lastLogin === today) {
        return profile;
    }

    let dailyStreak = profile.daily_streak;
    let superStreak = profile.super_streak;

    if (lastLogin === yesterday) {
        dailyStreak += 1;
    } else if (lastLogin !== null) {
        dailyStreak = 1;
        superStreak = 0;
    } else {
        dailyStreak = 1;
    }

    if (dailyStreak >= 3) {
        superStreak = dailyStreak;
    }

    return updateProfile(supabase, userId, {
        daily_streak: dailyStreak,
        super_streak: superStreak,
        last_login_date: new Date().toISOString(),
    });
}
