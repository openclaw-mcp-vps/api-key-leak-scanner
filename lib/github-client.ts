import { Buffer } from "node:buffer";
import { Octokit } from "@octokit/rest";

export interface RepoSummary {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  defaultBranch: string;
  updatedAt: string;
}

export interface RepoFile {
  path: string;
  content: string;
}

const TEXT_FILE_PATTERN =
  /\.(?:env|json|ya?ml|toml|ini|conf|config|js|mjs|cjs|ts|tsx|jsx|py|rb|go|rs|java|kt|gradle|sh|zsh|bash|ps1|tf|hcl|dockerfile|sql|md|txt)$/i;

const EXCLUDED_PATH_PATTERN =
  /(^|\/)(node_modules|dist|build|out|coverage|\.next|\.git|vendor|\.venv|venv)(\/|$)/;

function toOctokit(accessToken: string): Octokit {
  return new Octokit({ auth: accessToken });
}

export async function listUserRepos(accessToken: string): Promise<RepoSummary[]> {
  const octokit = toOctokit(accessToken);
  const response = await octokit.repos.listForAuthenticatedUser({
    sort: "updated",
    per_page: 100,
    affiliation: "owner,collaborator,organization_member"
  });

  return response.data.map((repo) => ({
    id: repo.id,
    name: repo.name,
    fullName: repo.full_name,
    private: repo.private,
    defaultBranch: repo.default_branch ?? "main",
    updatedAt: repo.updated_at ?? new Date(0).toISOString()
  }));
}

async function fetchDefaultBranch(accessToken: string, owner: string, repo: string): Promise<string> {
  const octokit = toOctokit(accessToken);
  const response = await octokit.repos.get({ owner, repo });
  return response.data.default_branch;
}

function shouldScanFile(path: string): boolean {
  if (EXCLUDED_PATH_PATTERN.test(path)) {
    return false;
  }

  const basename = path.split("/").pop() ?? "";
  if (basename.startsWith(".")) {
    return basename === ".env" || basename.startsWith(".env.");
  }

  return TEXT_FILE_PATTERN.test(path) || basename === "Dockerfile";
}

async function fetchFileContent(
  accessToken: string,
  owner: string,
  repo: string,
  path: string,
  ref: string
): Promise<string | null> {
  const octokit = toOctokit(accessToken);
  const response = await octokit.repos.getContent({ owner, repo, path, ref });

  if (!Array.isArray(response.data) && response.data.type === "file") {
    const size = response.data.size ?? 0;
    if (size > 400_000) {
      return null;
    }

    const encoding = response.data.encoding;
    const raw = response.data.content;
    if (!raw || encoding !== "base64") {
      return null;
    }

    const decoded = Buffer.from(raw, "base64").toString("utf-8");
    if (/\u0000/.test(decoded)) {
      return null;
    }

    return decoded;
  }

  return null;
}

export async function fetchRepoFilesForScanning(params: {
  accessToken: string;
  owner: string;
  repo: string;
  maxFiles?: number;
}): Promise<RepoFile[]> {
  const { accessToken, owner, repo, maxFiles = 120 } = params;
  const octokit = toOctokit(accessToken);

  const defaultBranch = await fetchDefaultBranch(accessToken, owner, repo);
  const branchResponse = await octokit.repos.getBranch({ owner, repo, branch: defaultBranch });
  const treeSha = branchResponse.data.commit.commit.tree.sha;

  const treeResponse = await octokit.git.getTree({
    owner,
    repo,
    tree_sha: treeSha,
    recursive: "true"
  });

  const filePaths = treeResponse.data.tree
    .filter((item) => item.type === "blob" && Boolean(item.path))
    .map((item) => item.path as string)
    .filter(shouldScanFile)
    .slice(0, maxFiles);

  const files: RepoFile[] = [];
  for (const path of filePaths) {
    const content = await fetchFileContent(accessToken, owner, repo, path, defaultBranch);
    if (content) {
      files.push({ path, content });
    }
  }

  return files;
}
