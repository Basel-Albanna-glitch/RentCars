import { redirect } from "next/navigation";
import { auth } from "./auth";
import type { Session } from "next-auth";

/** Sentinel branch id: matches no row, so a query using it returns nothing. */
export const UNASSIGNED_BRANCH = "__unassigned__";

export type StaffSession = Session & {
  user: Session["user"] & { role: "ADMIN" | "SUPER_ADMIN" };
};

/**
 * Guard for every page under /admin. The middleware already blocks anonymous
 * visitors, so this is the second line of defence and the place that narrows
 * the session type for the page body.
 */
export async function requireStaff(): Promise<StaffSession> {
  const session = await auth();
  const role = session?.user?.role;

  if (!session || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
    redirect("/");
  }

  return session as StaffSession;
}

export async function requireSuperAdmin(): Promise<StaffSession> {
  const session = await auth();

  if (!session || session.user.role !== "SUPER_ADMIN") {
    redirect("/");
  }

  return session as StaffSession;
}

/**
 * A branch admin is scoped to their own branch; a super admin sees everything
 * unless they pick a branch from a filter.
 */
export function branchFilter(session: StaffSession, requested?: string) {
  if (session.user.role === "ADMIN") {
    // A branch admin with no branch assigned is a misconfiguration. Scope them
    // to a branch id that matches nothing rather than to the whole system.
    return session.user.branchId ?? UNASSIGNED_BRANCH;
  }
  return requested || undefined;
}
