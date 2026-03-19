import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID!,
      clientSecret: process.env.AUTH_GITHUB_SECRET!,
      authorization: {
        params: {
          scope: "read:user user:email repo",
        },
      },
    }),
  ],
  session: {
    strategy: "database",
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;

        // Attach GitHub access token to session
        const account = await prisma.account.findFirst({
          where: { userId: user.id, provider: "github" },
        });
        if (account?.access_token) {
          (session as unknown as Record<string, unknown>).accessToken =
            account.access_token;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
