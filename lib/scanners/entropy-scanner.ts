import { createHash } from "node:crypto";
import type { ScanFinding } from "@/lib/scanners/types";

const TOKEN_CANDIDATE = /\b[A-Za-z0-9_\-\/+=]{20,}\b/g;
const MIN_ENTROPY = 4.2;

function shannonEntropy(value: string): number {
  const frequencies = new Map<string, number>();
  for (const char of value) {
    frequencies.set(char, (frequencies.get(char) ?? 0) + 1);
  }

  let entropy = 0;
  for (const count of frequencies.values()) {
    const p = count / value.length;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}

function looksLikeIdentifier(value: string): boolean {
  const lower = value.toLowerCase();
  if (lower.startsWith("http") || lower.includes("example") || lower.includes("localhost")) {
    return false;
  }
  if (/^[a-f0-9]{32,}$/i.test(value)) {
    return false;
  }
  return true;
}

function findingId(parts: string[]): string {
  return createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 16);
}

export function scanTextWithEntropy(content: string, filePath: string): ScanFinding[] {
  const findings: ScanFinding[] = [];
  const lines = content.split(/\r?\n/);

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    TOKEN_CANDIDATE.lastIndex = 0;

    for (const match of line.matchAll(TOKEN_CANDIDATE)) {
      const candidate = match[0];
      if (!looksLikeIdentifier(candidate)) {
        continue;
      }
      const entropy = shannonEntropy(candidate);
      if (candidate.length >= 24 && entropy >= MIN_ENTROPY) {
        findings.push({
          id: findingId([filePath, String(lineIndex + 1), "entropy", candidate]),
          type: "entropy",
          rule: "High-Entropy Token",
          description: "Detected a high-entropy token that resembles a secret.",
          severity: entropy > 4.8 ? "high" : "medium",
          filePath,
          line: lineIndex + 1,
          match: `${candidate.slice(0, 4)}...${candidate.slice(-4)}`,
          entropy: Number(entropy.toFixed(2)),
          remediation:
            "Move this value into a managed secret store and rotate it if it is currently active in production systems."
        });
      }
    }
  }

  return findings;
}
