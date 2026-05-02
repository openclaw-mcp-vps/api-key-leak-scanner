import type { Metadata } from "next";
import Link from "next/link";
import { Space_Grotesk, Geist } from "next/font/google";
import { getServerSession } from "next-auth";
import "@/app/globals.css";
import { authOptions } from "@/lib/auth";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://api-key-leak-scanner.app"),
  title: {
    default: "API Key Leak Scanner",
    template: "%s | API Key Leak Scanner"
  },
  description:
    "Scan GitHub repositories, local code, and CI configuration for exposed API keys and secrets before attackers find them.",
  keywords: [
    "api key leak scanner",
    "secret scanning",
    "github security",
    "devops security",
    "startup security"
  ],
  openGraph: {
    title: "API Key Leak Scanner",
    description:
      "Detect exposed secrets in code, CI pipelines, and config files with remediation guidance your team can ship quickly.",
    type: "website",
    url: "https://api-key-leak-scanner.app"
  },
  twitter: {
    card: "summary_large_image",
    title: "API Key Leak Scanner",
    description:
      "Scan repositories and uploaded code for leaked API keys with entropy + pattern analysis."
  },
  robots: {
    index: true,
    follow: true
  }
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className={`${spaceGrotesk.className} bg-[#0d1117] text-slate-100`}>
        <header className="sticky top-0 z-50 border-b border-slate-800/70 bg-[#0d1117]/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <Link href="/" className="text-lg font-semibold tracking-tight text-white">
              API Key Leak Scanner
            </Link>
            <nav className="flex items-center gap-4 text-sm text-slate-300">
              <Link href="/#pricing" className="hover:text-white">
                Pricing
              </Link>
              <Link href="/#faq" className="hover:text-white">
                FAQ
              </Link>
              {session ? (
                <Link
                  href="/dashboard"
                  className="rounded-md border border-sky-500/60 px-3 py-1.5 text-sky-300 transition hover:bg-sky-500/10"
                >
                  Dashboard
                </Link>
              ) : (
                <Link
                  href="/api/auth/signin?callbackUrl=/dashboard"
                  className="rounded-md border border-sky-500/60 px-3 py-1.5 text-sky-300 transition hover:bg-sky-500/10"
                >
                  Sign in with GitHub
                </Link>
              )}
            </nav>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
