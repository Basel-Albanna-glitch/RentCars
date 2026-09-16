import type { DefaultSession } from "next-auth";

/**
 * The auth callbacks put `id` and `role` on the token and the session, so teach
 * TypeScript about them. `user` is declared as required because every session
 * this app hands out is created through those callbacks.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      branchId?: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role?: string;
    branchId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
    branchId?: string | null;
  }
}

export {};
