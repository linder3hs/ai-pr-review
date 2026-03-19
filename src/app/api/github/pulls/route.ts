import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getRepoPulls } from "@/lib/github";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.accessToken) {
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

  try {
    const pulls = await getRepoPulls(session.accessToken, owner, repo);
    return NextResponse.json(pulls);
  } catch (error) {
    console.error("Failed to fetch pulls:", error);
    return NextResponse.json(
      { error: "Failed to fetch pull requests" },
      { status: 500 }
    );
  }
}
