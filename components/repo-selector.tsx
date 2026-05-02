"use client";

import { useEffect, useMemo, useState } from "react";

interface RepoSummary {
  id: number;
  fullName: string;
  private: boolean;
  updatedAt: string;
}

interface RepoSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function RepoSelector({ value, onChange }: RepoSelectorProps) {
  const [repos, setRepos] = useState<RepoSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadRepos = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/github/repos", { cache: "no-store" });
        const json = (await response.json()) as { repos?: RepoSummary[]; error?: string };
        if (!response.ok) {
          throw new Error(json.error || "Failed to load repositories");
        }
        if (!cancelled) {
          setRepos(json.repos ?? []);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load repositories");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadRepos();
    return () => {
      cancelled = true;
    };
  }, []);

  const options = useMemo(
    () =>
      repos.map((repo) => ({
        value: repo.fullName,
        label: `${repo.fullName}${repo.private ? " (private)" : ""}`
      })),
    [repos]
  );

  if (loading) {
    return <p className="text-sm text-slate-400">Loading repositories…</p>;
  }

  if (error) {
    return <p className="text-sm text-rose-300">{error}</p>;
  }

  return (
    <div>
      <label htmlFor="repo" className="mb-2 block text-sm font-medium text-slate-200">
        Select Repository
      </label>
      <select
        id="repo"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
      >
        <option value="">Choose a repository</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
