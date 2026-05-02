import { scanTextWithEntropy } from "@/lib/scanners/entropy-scanner";
import { scanTextWithPatterns } from "@/lib/scanners/pattern-scanner";
import type { ScanReport, ScannedFile } from "@/lib/scanners/types";

export function runScan(files: ScannedFile[]): ScanReport {
  const start = Date.now();
  const findings = files.flatMap((file) => {
    const patternFindings = scanTextWithPatterns(file.content, file.path);
    const entropyFindings = scanTextWithEntropy(file.content, file.path);
    return [...patternFindings, ...entropyFindings];
  });

  const dedupedFindings = Array.from(new Map(findings.map((finding) => [finding.id, finding])).values()).sort(
    (a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2 };
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return a.filePath.localeCompare(b.filePath) || a.line - b.line;
    }
  );

  return {
    findings: dedupedFindings,
    scannedFiles: files.length,
    durationMs: Date.now() - start,
    generatedAt: new Date().toISOString()
  };
}
