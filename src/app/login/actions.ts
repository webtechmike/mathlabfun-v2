"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signInWithEmail(formData: FormData) {
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    if (!email || !password) {
        redirect("/login?error=missing_credentials");
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error) {
        redirect(`/login?error=${encodeURIComponent(error.message)}`);
    }

    redirect("/");
}

export async function signUpWithEmail(formData: FormData) {
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    if (!email || !password) {
        redirect("/login?mode=signup&error=missing_credentials");
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
        redirect(
            `/login?mode=signup&error=${encodeURIComponent(error.message)}`
        );
    }

    redirect("/login?mode=signup&info=check_email");
}

export async function signOut() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/");
}
