import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe half of the NextAuth config: no Prisma adapter, no bcrypt, no
 * providers — just enough to decode the session JWT. The middleware builds its
 * own NextAuth instance from this so it can run on the edge runtime, while
 * `lib/auth.ts` extends it with the adapter and the real providers.
 */
export const authConfig = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        // Branch admins are scoped by this; a user with no branch gets null.
        token.branchId = (user as any).branchId ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.branchId = (token.branchId as string | null) ?? null;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
