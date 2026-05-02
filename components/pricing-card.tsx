import Link from "next/link";
import { ShieldAlert, CheckCircle2 } from "lucide-react";

const FEATURES = [
  "GitHub repository scanning",
  "Uploaded file + CI config scanning",
  "Pattern detection for major provider keys",
  "Entropy analysis for unknown secrets",
  "Actionable remediation suggestions",
  "Webhook-compatible purchase unlock"
];

export function PricingCard() {
  const checkoutUrl = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK;

  return (
    <div className="card rounded-2xl p-6 shadow-2xl shadow-sky-950/20 sm:p-8">
      <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-sky-500/30 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-sky-300">
        <ShieldAlert className="h-3.5 w-3.5" />
        Security Tools
      </div>
      <h3 className="text-2xl font-semibold text-white">Team Plan</h3>
      <p className="mt-2 text-slate-300">Continuous secret scanning for startup teams shipping fast.</p>
      <p className="mt-6 text-4xl font-bold text-white">
        $22<span className="ml-1 text-base font-medium text-slate-400">/month</span>
      </p>

      <ul className="mt-6 space-y-3 text-sm text-slate-200">
        {FEATURES.map((feature) => (
          <li key={feature} className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-7 space-y-3">
        <Link
          href={checkoutUrl || "#"}
          className="block rounded-lg bg-sky-500 px-4 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-sky-400"
          aria-disabled={!checkoutUrl}
        >
          Start Protected Deployment
        </Link>
        <p className="text-xs text-slate-400">
          Hosted checkout through Stripe Payment Links. Access unlocks after successful purchase webhook processing.
        </p>
      </div>
    </div>
  );
}
