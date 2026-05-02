import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ShieldCheck, CreditCard, Github, ArrowRight, LogOut } from "lucide-react";
import { authOptions } from "@/lib/auth";
import { hasPaidAccess } from "@/lib/paywall";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/");
  }

  const paidAccess = await hasPaidAccess();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-white">Security Dashboard</h1>
          <p className="mt-2 text-slate-300">Signed in as {session.user.email ?? "GitHub user"}</p>
        </div>
        <Link
          href="/api/auth/signout?callbackUrl=/"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Link>
      </div>

      {paidAccess ? (
        <section className="space-y-6">
          <div className="card rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <ShieldCheck className="mt-1 h-5 w-5 text-emerald-300" />
              <div>
                <h2 className="text-xl font-semibold text-white">Active Access</h2>
                <p className="mt-2 max-w-2xl text-sm text-slate-300">
                  Your paywall cookie is active. You can now run repository and uploaded file scans with full reporting.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Link href="/scan" className="card rounded-xl p-5 transition hover:border-sky-400/60">
              <p className="text-sm uppercase tracking-wide text-slate-400">Scanner</p>
              <h3 className="mt-1 text-lg font-semibold text-white">Run a New Secret Scan</h3>
              <p className="mt-2 text-sm text-slate-300">Choose a GitHub repo or upload files and detect leaked credentials.</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-sky-300">
                Open Scanner <ArrowRight className="h-4 w-4" />
              </span>
            </Link>

            <a
              href="https://docs.github.com/en/code-security/secret-scanning"
              target="_blank"
              rel="noreferrer"
              className="card rounded-xl p-5 transition hover:border-sky-400/60"
            >
              <p className="text-sm uppercase tracking-wide text-slate-400">Reference</p>
              <h3 className="mt-1 text-lg font-semibold text-white">GitHub Secret Scanning Docs</h3>
              <p className="mt-2 text-sm text-slate-300">Compare findings and harden repository security controls.</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-sky-300">
                Read Docs <ArrowRight className="h-4 w-4" />
              </span>
            </a>
          </div>
        </section>
      ) : (
        <section className="card rounded-2xl p-6 sm:p-8">
          <h2 className="text-2xl font-semibold text-white">Unlock Scanner Access</h2>
          <p className="mt-3 max-w-2xl text-sm text-slate-300">
            The scanner is behind a paywall. Complete checkout and then activate access for this signed-in account.
            Webhook-confirmed purchases are linked by email.
          </p>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <Link
              href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK || "#"}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
            >
              <CreditCard className="h-4 w-4" />
              Buy Team Plan ($22/mo)
            </Link>
            <form action="/api/access/unlock" method="post">
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-500"
              >
                <Github className="h-4 w-4" />
                Activate Access for My Account
              </button>
            </form>
          </div>

          <p className="mt-4 text-xs text-slate-400">
            If checkout is complete but activation fails, ensure the Stripe webhook is configured to
            `/api/webhooks/lemonsqueezy` and then retry activation.
          </p>
        </section>
      )}
    </div>
  );
}
