import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { listUserRepos } from "@/lib/github-client";

const repoSchema = z.object({
  id: z.number(),
  name: z.string(),
  fullName: z.string(),
  private: z.boolean(),
  defaultBranch: z.string(),
  updatedAt: z.string()
});

export async function GET() {
  const session = await getServerSession(authOptions);
  const accessToken = session?.user?.githubAccessToken;

  if (!session?.user || !accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const repos = await listUserRepos(accessToken);
    return NextResponse.json({ repos: z.array(repoSchema).parse(repos) });
  } catch (error) {
    console.error("Failed to list repos", error);
    return NextResponse.json({ error: "Could not load repositories" }, { status: 500 });
  }
}
