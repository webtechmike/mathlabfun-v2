import Link from "next/link";
import { signInWithEmail, signUpWithEmail } from "./actions";

interface LoginPageProps {
    searchParams: Promise<{
        mode?: string;
        error?: string;
        info?: string;
    }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
    const { mode, error, info } = await searchParams;
    const isSignup = mode === "signup";
    const action = isSignup ? signUpWithEmail : signInWithEmail;

    return (
        <div className="bg-space-800/60 ring-space-100/10 flex w-full max-w-md flex-col gap-6 rounded-2xl p-8 ring-1 backdrop-blur">
            <div className="flex justify-center gap-6 text-sm tracking-wide uppercase">
                <Link
                    href="/login"
                    className={
                        !isSignup
                            ? "text-spacebucks border-spacebucks border-b-2 pb-1"
                            : "opacity-70"
                    }
                >
                    Sign in
                </Link>
                <Link
                    href="/login?mode=signup"
                    className={
                        isSignup
                            ? "text-spacebucks border-spacebucks border-b-2 pb-1"
                            : "opacity-70"
                    }
                >
                    Sign up
                </Link>
            </div>

            {error && (
                <div className="bg-critical/10 text-critical rounded-md px-3 py-2 text-sm">
                    {decodeURIComponent(error)}
                </div>
            )}
            {info === "check_email" && (
                <div className="bg-correct/10 text-correct rounded-md px-3 py-2 text-sm">
                    Check your email for a confirmation link.
                </div>
            )}

            <form action={action} className="flex flex-col gap-3">
                <input
                    type="email"
                    name="email"
                    placeholder="Email"
                    required
                    className="bg-space-900 ring-space-100/20 focus:ring-spacebucks rounded-md px-3 py-2 ring-1 transition outline-none focus:ring-2"
                />
                <input
                    type="password"
                    name="password"
                    placeholder="Password"
                    required
                    minLength={6}
                    className="bg-space-900 ring-space-100/20 focus:ring-spacebucks rounded-md px-3 py-2 ring-1 transition outline-none focus:ring-2"
                />
                <button
                    type="submit"
                    className="bg-spacebucks text-space-900 mt-2 rounded-md px-3 py-2 font-semibold transition hover:brightness-110"
                >
                    {isSignup ? "Sign up" : "Sign in"}
                </button>
            </form>
        </div>
    );
}
