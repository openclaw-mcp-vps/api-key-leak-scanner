"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { RepoSelector } from "@/components/repo-selector";
import { ScanResults } from "@/components/scan-results";
import type { ScanReport } from "@/lib/scanners/types";

type ScanSource = "github" | "upload";

interface UploadedFilePayload {
  path: string;
  content: string;
}

interface ScanApiResponse {
  report: ScanReport;
}

export function ScanWorkbench() {
  const [source, setSource] = useState<ScanSource>("github");
  const [repoFullName, setRepoFullName] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ScanReport | null>(null);

  const hasFiles = useMemo(() => (selectedFiles?.length ?? 0) > 0, [selectedFiles]);

  const handleScan = async () => {
    setError(null);
    setReport(null);

    try {
      setSubmitting(true);
      let payload: Record<string, unknown>;

      if (source === "github") {
        if (!repoFullName.includes("/")) {
          throw new Error("Select a repository before starting a GitHub scan.");
        }
        const [owner, repo] = repoFullName.split("/");
        payload = { source: "github", owner, repo, maxFiles: 120 };
      } else {
        if (!selectedFiles || selectedFiles.length === 0) {
          throw new Error("Upload at least one file for local scanning.");
        }

        const files: UploadedFilePayload[] = await Promise.all(
          Array.from(selectedFiles).map(async (file) => ({
            path: file.webkitRelativePath || file.name,
            content: await file.text()
          }))
        );

        payload = { source: "upload", files };
      }

      const response = await fetch("/api/scan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const json = (await response.json()) as ScanApiResponse & { error?: string };
      if (!response.ok) {
        throw new Error(json.error || "Scan failed");
      }
      setReport(json.report);
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "Scan failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="card rounded-2xl p-6">
        <div className="grid gap-4 md:grid-cols-2 md:items-end">
          <div>
            <label htmlFor="source" className="mb-2 block text-sm font-medium text-slate-200">
              Scan Source
            </label>
            <select
              id="source"
              value={source}
              onChange={(event) => setSource(event.target.value as ScanSource)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
            >
              <option value="github">GitHub Repository</option>
              <option value="upload">Uploaded Files</option>
            </select>
          </div>

          {source === "upload" ? (
            <div>
              <label htmlFor="files" className="mb-2 block text-sm font-medium text-slate-200">
                Upload Files
              </label>
              <input
                id="files"
                type="file"
                multiple
                onChange={(event) => setSelectedFiles(event.target.files)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
              />
              <p className="mt-2 text-xs text-slate-400">{hasFiles ? `${selectedFiles?.length} files selected` : "No files selected"}</p>
            </div>
          ) : (
            <RepoSelector value={repoFullName} onChange={setRepoFullName} />
          )}
        </div>

        <button
          type="button"
          onClick={() => void handleScan()}
          disabled={submitting}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {submitting ? "Scanning…" : "Run Scan"}
        </button>

        {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
      </section>

      {report ? <ScanResults report={report} /> : null}
    </div>
  );
}
