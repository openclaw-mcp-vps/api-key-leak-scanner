import { createHash } from "node:crypto";
import type { ScanFinding } from "@/lib/scanners/types";

interface SecretPattern {
  name: string;
  regex: RegExp;
  description: string;
  severity: ScanFinding["severity"];
  remediation: string;
}

const SECRET_PATTERNS: SecretPattern[] = [
  {
    name: "OpenAI API Key",
    regex: /sk-(?:proj-|live-|test-)?[A-Za-z0-9_-]{20,}/g,
    description: "Detected a string that matches the OpenAI API key format.",
    severity: "critical",
    remediation: "Revoke this key in OpenAI dashboard, rotate it, and load the replacement from environment variables."
  },
  {
    name: "AWS Access Key ID",
    regex: /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g,
    description: "Detected an AWS access key identifier.",
    severity: "critical",
    remediation: "Disable the exposed IAM key, create a replacement with least privilege, and remove hard-coded credentials."
  },
  {
    name: "GitHub Personal Access Token",
    regex: /\bgh[opurs]_[A-Za-z0-9]{30,}\b/g,
    description: "Detected a GitHub token-like string.",
    severity: "critical",
    remediation: "Revoke the token in GitHub settings and replace repository automation with GitHub App or OIDC credentials."
  },
  {
    name: "Stripe Secret Key",
    regex: /\bsk_(?:live|test)_[A-Za-z0-9]{24,}\b/g,
    description: "Detected a Stripe secret key pattern.",
    severity: "critical",
    remediation: "Roll the secret key in Stripe immediately and use server-side environment variables for secret storage."
  },
  {
    name: "Google API Key",
    regex: /\bAIza[0-9A-Za-z\-_]{35}\b/g,
    description: "Detected a Google API key pattern.",
    severity: "high",
    remediation: "Restrict the key by API and referrer/IP, rotate it, and keep it out of committed source files."
  },
  {
    name: "Slack Token",
    regex: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/g,
    description: "Detected a Slack token pattern.",
    severity: "critical",
    remediation: "Revoke the token via Slack app settings and replace with a new token managed through secret storage."
  },
  {
    name: "Generic Private Key Block",
    regex: /-----BEGIN (?:RSA|OPENSSH|EC|DSA|PGP) PRIVATE KEY-----/g,
    description: "Detected a private key block header.",
    severity: "critical",
    remediation: "Treat this key as compromised, rotate immediately, and remove the private material from the repository history."
  },
  {
    name: "Likely Hard-Coded Password Assignment",
    regex: /\b(?:password|passwd|pwd|secret)\s*[:=]\s*["'][^"'\n]{8,}["']/gi,
    description: "Detected a probable hard-coded credential assignment.",
    severity: "medium",
    remediation: "Move credentials to environment variables or a secret manager and avoid storing them in source code."
  }
];

function redactMatch(value: string): string {
  if (value.length <= 8) {
    return "[redacted]";
  }
  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function findingId(parts: string[]): string {
  return createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 16);
}

export function scanTextWithPatterns(content: string, filePath: string): ScanFinding[] {
  const findings: ScanFinding[] = [];
  const lines = content.split(/\r?\n/);

  for (const pattern of SECRET_PATTERNS) {
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      const line = lines[lineIndex];
      pattern.regex.lastIndex = 0;
      const matches = [...line.matchAll(pattern.regex)];
      for (const match of matches) {
        const token = match[0];
        findings.push({
          id: findingId([filePath, String(lineIndex + 1), pattern.name, token]),
          type: "pattern",
          rule: pattern.name,
          description: pattern.description,
          severity: pattern.severity,
          filePath,
          line: lineIndex + 1,
          match: redactMatch(token),
          remediation: pattern.remediation
        });
      }
    }
  }

  return findings;
}
