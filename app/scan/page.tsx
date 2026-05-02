import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ScanWorkbench } from "@/components/scan-workbench";
import { authOptions } from "@/lib/auth";
import { hasPaidAccess } from "@/lib/paywall";

export default async function ScanPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/");
  }

  const paidAccess = await hasPaidAccess();
  if (!paidAccess) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-white">Run Secret Scan</h1>
      <p className="mt-3 max-w-3xl text-sm text-slate-300">
        Scan GitHub repositories or uploaded files for exposed credentials using signature patterns and entropy analysis.
      </p>
      <div className="mt-8">
        <ScanWorkbench />
      </div>
    </div>
  );
}
