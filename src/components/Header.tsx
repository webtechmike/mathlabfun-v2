import Link from "next/link";
import { faUserSecret } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/supabase/profile";
import { SpacebucksIcon } from "./SpacebucksIcon";
import { UserMenu } from "./UserMenu";

export async function Header() {
    let spacebucks = 0;
    let isLoggedIn = false;

    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();
        if (user) {
            isLoggedIn = true;
            const profile = await getProfile(supabase, user.id);
            spacebucks = profile?.spacebucks ?? 0;
        }
    } catch {
        // Supabase not configured yet; render the logged-out header.
    }

    return (
        <header className="absolute top-6 right-6 z-10 flex items-center gap-4 text-white">
            {isLoggedIn ? (
                <>
                    <div className="flex items-center gap-2">
                        <SpacebucksIcon showTooltip />
                        <span className="text-lg font-semibold drop-shadow">
                            {spacebucks}
                        </span>
                    </div>
                    <UserMenu />
                </>
            ) : (
                <Link
                    href="/login"
                    className="hover:text-spacebucks transition"
                    aria-label="Sign in"
                >
                    <FontAwesomeIcon icon={faUserSecret} size="2x" />
                </Link>
            )}
        </header>
    );
}
