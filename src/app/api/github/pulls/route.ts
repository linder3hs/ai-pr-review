import { NextRequest, NextResponse } from "next/server";
import { getServerAccessToken } from "@/lib/auth-utils";
import { getRepoPulls } from "@/lib/github";

const GITHUB_NAME_RE = /^[a-zA-Z0-9._-]+$/;

export async function GET(request: NextRequest) {
  const accessToken = await getServerAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const owner = searchParams.get("owner");
  const repo = searchParams.get("repo");

  if (!owner || !repo) {
    return NextResponse.json(
      { error: "owner and repo are required" },
      { status: 400 }
    );
  }

  if (!GITHUB_NAME_RE.test(owner) || !GITHUB_NAME_RE.test(repo) || owner.length > 100 || repo.length > 100) {
    return NextResponse.json(
      { error: "Invalid owner or repo name" },
      { status: 400 }
    );
  }

  try {
    const pulls = await getRepoPulls(accessToken, owner, repo);
    return NextResponse.json(pulls);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch pull requests" },
      { status: 500 }
    );
  }
}
