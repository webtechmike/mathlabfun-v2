import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { config as faConfig } from "@fortawesome/fontawesome-svg-core";
import "@fortawesome/fontawesome-svg-core/styles.css";
import "./globals.css";
import { OuterspaceBackground } from "@/components/OuterspaceBackground";
import { Header } from "@/components/Header";
import {
    GAME_HEADER_SLOT_ID,
    GAME_CONTROLS_SLOT_ID,
} from "@/components/GameHeaderPortal";

faConfig.autoAddCss = false;

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});
const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Mathlab.fun",
    description:
        "Daily math drills with streaks, spacebucks, and a galaxy theme.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        >
            <body className="bg-space-900 text-space-100 relative isolate flex min-h-full flex-col">
                <OuterspaceBackground />
                <div className="fixed inset-x-0 top-0 z-20">
                    <header className="flex items-center justify-between gap-4 px-6 py-4">
                        <div
                            id={GAME_HEADER_SLOT_ID}
                            className="flex min-w-0 flex-1 items-center"
                        />
                        <Header />
                    </header>
                    <div
                        id={GAME_CONTROLS_SLOT_ID}
                        className="flex justify-center px-4"
                    />
                </div>
                <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
                    {children}
                </main>
                <footer className="text-space-100/60 absolute bottom-4 w-full text-center text-xs">
                    <Link href="/" className="hover:text-spacebucks transition">
                        &copy; Mathlab.fun
                    </Link>
                </footer>
            </body>
        </html>
    );
}
