export type FindingSeverity = "critical" | "high" | "medium";

export interface ScanFinding {
  id: string;
  type: "pattern" | "entropy";
  rule: string;
  description: string;
  severity: FindingSeverity;
  filePath: string;
  line: number;
  match: string;
  entropy?: number;
  remediation: string;
}

export interface ScannedFile {
  path: string;
  content: string;
}

export interface ScanReport {
  findings: ScanFinding[];
  scannedFiles: number;
  durationMs: number;
  generatedAt: string;
}
