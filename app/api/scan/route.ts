import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { fetchRepoFilesForScanning } from "@/lib/github-client";
import { hasPaidAccess } from "@/lib/paywall";
import { runScan } from "@/lib/scan-service";
import type { ScannedFile } from "@/lib/scanners/types";

const uploadedFileSchema = z.object({
  path: z.string().min(1),
  content: z.string().max(500_000)
});

const githubPayloadSchema = z.object({
  source: z.literal("github"),
  owner: z.string().min(1),
  repo: z.string().min(1),
  maxFiles: z.number().int().min(10).max(300).optional()
});

const uploadPayloadSchema = z.object({
  source: z.literal("upload"),
  files: z.array(uploadedFileSchema).min(1).max(50)
});

const scanPayloadSchema = z.union([githubPayloadSchema, uploadPayloadSchema]);

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accessGranted = await hasPaidAccess();
  if (!accessGranted) {
    return NextResponse.json({ error: "Paid access required" }, { status: 403 });
  }

  try {
    const parsed = scanPayloadSchema.parse(await request.json());
    let files: ScannedFile[];

    if (parsed.source === "github") {
      const accessToken = session.user.githubAccessToken;
      if (!accessToken) {
        return NextResponse.json({ error: "Missing GitHub OAuth token" }, { status: 400 });
      }

      const repoFiles = await fetchRepoFilesForScanning({
        accessToken,
        owner: parsed.owner,
        repo: parsed.repo,
        maxFiles: parsed.maxFiles ?? 120
      });

      files = repoFiles.map((entry) => ({
        path: entry.path,
        content: entry.content
      }));
    } else {
      files = parsed.files.map((file) => ({
        path: file.path,
        content: file.content
      }));
    }

    const report = runScan(files);
    return NextResponse.json({ report });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid payload", details: error.flatten() }, { status: 400 });
    }

    console.error("Scan request failed", error);
    return NextResponse.json({ error: "Scan failed" }, { status: 500 });
  }
}
