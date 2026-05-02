"use client";

import { AlertCircle, ShieldAlert, ShieldCheck } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { ScanReport } from "@/lib/scanners/types";

interface ScanResultsProps {
  report: ScanReport;
}

const severityColor: Record<string, string> = {
  critical: "#f87171",
  high: "#fb923c",
  medium: "#facc15"
};

export function ScanResults({ report }: ScanResultsProps) {
  const severityCounts = report.findings.reduce(
    (acc, finding) => {
      acc[finding.severity] += 1;
      return acc;
    },
    { critical: 0, high: 0, medium: 0 }
  );

  const chartData = [
    { name: "Critical", key: "critical", count: severityCounts.critical },
    { name: "High", key: "high", count: severityCounts.high },
    { name: "Medium", key: "medium", count: severityCounts.medium }
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Files Scanned</p>
          <p className="mt-1 text-2xl font-semibold text-white">{report.scannedFiles}</p>
        </div>
        <div className="card rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Findings</p>
          <p className="mt-1 text-2xl font-semibold text-white">{report.findings.length}</p>
        </div>
        <div className="card rounded-xl p-4">
          <p className="text-xs uppercase tracking-wide text-slate-400">Scan Duration</p>
          <p className="mt-1 text-2xl font-semibold text-white">{report.durationMs}ms</p>
        </div>
      </div>

      <div className="card rounded-xl p-4">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-200">Severity Breakdown</h3>
        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="name" tick={{ fill: "#cbd5e1", fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fill: "#cbd5e1", fontSize: 12 }} />
              <Tooltip cursor={{ fill: "#172031" }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.key} fill={severityColor[entry.key]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-3">
        {report.findings.length === 0 ? (
          <div className="card flex items-center gap-3 rounded-xl p-4">
            <ShieldCheck className="h-5 w-5 text-emerald-300" />
            <p className="text-sm text-slate-200">No obvious secrets detected in scanned inputs.</p>
          </div>
        ) : (
          report.findings.map((finding) => (
            <article key={finding.id} className="card rounded-xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  {finding.severity === "critical" ? (
                    <ShieldAlert className="h-4 w-4 text-rose-300" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-300" />
                  )}
                  {finding.rule}
                </div>
                <span className="rounded-full border border-slate-700 px-2 py-0.5 text-xs uppercase tracking-wide text-slate-300">
                  {finding.severity}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-300">{finding.description}</p>
              <p className="mt-2 text-xs text-slate-400">
                {finding.filePath}:{finding.line} · Match {finding.match}
                {finding.entropy ? ` · Entropy ${finding.entropy}` : ""}
              </p>
              <p className="mt-2 text-sm text-sky-200">Remediation: {finding.remediation}</p>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
