import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Get the GitHub access token for the current authenticated user.
 * This should ONLY be called server-side (API routes, server components).
 * The token is never exposed to the client.
 */
export async function getServerAccessToken(): Promise<string | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, provider: "github" },
    select: { access_token: true },
  });

  return account?.access_token ?? null;
}
