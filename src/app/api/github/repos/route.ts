import { NextResponse } from "next/server";
import { getServerAccessToken } from "@/lib/auth-utils";
import { getUserRepos } from "@/lib/github";

export async function GET() {
  const accessToken = await getServerAccessToken();
  if (!accessToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const repos = await getUserRepos(accessToken);
    return NextResponse.json(repos);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch repositories" },
      { status: 500 }
    );
  }
}
