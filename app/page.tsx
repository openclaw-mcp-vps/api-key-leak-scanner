import Link from "next/link";
import { getServerSession } from "next-auth";
import { AlertTriangle, ShieldCheck, Zap, GitBranch, FileWarning, Lock } from "lucide-react";
import { PricingCard } from "@/components/pricing-card";
import { authOptions } from "@/lib/auth";

const FAQ_ITEMS = [
  {
    q: "How does detection work?",
    a: "Each scan combines known-key pattern matching with entropy analysis to catch both recognizable tokens and unknown high-entropy secrets in source code, config files, and pipeline definitions."
  },
  {
    q: "Do you scan private GitHub repositories?",
    a: "Yes. After GitHub OAuth sign-in, the scanner uses your token to list repositories you can access and scans only the files needed for security analysis."
  },
  {
    q: "What happens after a secret is found?",
    a: "Every finding includes severity, file/line location, and remediation guidance so developers can rotate credentials and remove the leak quickly."
  },
  {
    q: "How is tool access controlled?",
    a: "The scanner dashboard is paywalled. A successful Stripe checkout webhook records your purchase, then your account can activate an access cookie for protected routes."
  }
];

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20 pt-14 sm:px-6 lg:px-8">
      <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <p className="inline-flex items-center rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-sky-300">
            Built for Dev + DevOps Teams
          </p>
          <h1 className="mt-6 text-4xl font-bold leading-tight text-white sm:text-5xl">
            Scan Code Repos for Exposed API Keys Before They Turn Into Incidents
          </h1>
          <p className="mt-5 max-w-2xl text-lg text-slate-300">
            API key leaks are one commit away from cloud abuse, service lockouts, and emergency rotations. API Key Leak
            Scanner checks GitHub repos, uploaded code, and CI/CD configs with practical remediation output your team can
            act on immediately.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href={session ? "/dashboard" : "/api/auth/signin?callbackUrl=/dashboard"}
              className="rounded-lg bg-sky-500 px-5 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
            >
              {session ? "Open Security Dashboard" : "Sign In with GitHub"}
            </Link>
            <Link
              href="#pricing"
              className="rounded-lg border border-slate-700 px-5 py-3 text-center text-sm font-semibold text-slate-200 transition hover:border-slate-500"
            >
              View Pricing
            </Link>
          </div>
        </div>

        <div className="card rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-white">What teams detect first week</h2>
          <ul className="mt-5 space-y-4 text-sm text-slate-200">
            <li className="flex items-start gap-3">
              <GitBranch className="mt-0.5 h-4 w-4 text-sky-300" />
              Dormant API keys inside old integration branches.
            </li>
            <li className="flex items-start gap-3">
              <FileWarning className="mt-0.5 h-4 w-4 text-sky-300" />
              Hard-coded secrets in deployment scripts and Terraform files.
            </li>
            <li className="flex items-start gap-3">
              <Lock className="mt-0.5 h-4 w-4 text-sky-300" />
              Service credentials committed to CI environment configuration.
            </li>
          </ul>
        </div>
      </section>

      <section className="mt-20 grid gap-6 md:grid-cols-3">
        <div className="card rounded-xl p-5">
          <AlertTriangle className="h-5 w-5 text-amber-300" />
          <h3 className="mt-3 text-lg font-semibold text-white">The Problem</h3>
          <p className="mt-2 text-sm text-slate-300">
            Startup teams move fast and accidentally commit credentials, exposing billing accounts and production data.
          </p>
        </div>
        <div className="card rounded-xl p-5">
          <ShieldCheck className="h-5 w-5 text-emerald-300" />
          <h3 className="mt-3 text-lg font-semibold text-white">The Solution</h3>
          <p className="mt-2 text-sm text-slate-300">
            Automated repo + file scans identify risky tokens and return line-level findings with guided remediation.
          </p>
        </div>
        <div className="card rounded-xl p-5">
          <Zap className="h-5 w-5 text-sky-300" />
          <h3 className="mt-3 text-lg font-semibold text-white">Immediate Value</h3>
          <p className="mt-2 text-sm text-slate-300">
            Your team gets fast feedback before release, reducing costly incident response and downtime from leaked keys.
          </p>
        </div>
      </section>

      <section id="pricing" className="mt-20 grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
        <div>
          <h2 className="text-3xl font-bold text-white">Security Coverage Without Enterprise Bloat</h2>
          <p className="mt-4 max-w-2xl text-slate-300">
            API Key Leak Scanner is built for teams that need serious protection but can’t justify expensive security
            suites. Pay monthly, connect GitHub, and start scanning in minutes.
          </p>
        </div>
        <PricingCard />
      </section>

      <section id="faq" className="mt-20">
        <h2 className="text-3xl font-bold text-white">FAQ</h2>
        <div className="mt-6 space-y-4">
          {FAQ_ITEMS.map((item) => (
            <div key={item.q} className="card rounded-xl p-5">
              <h3 className="text-base font-semibold text-white">{item.q}</h3>
              <p className="mt-2 text-sm text-slate-300">{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
