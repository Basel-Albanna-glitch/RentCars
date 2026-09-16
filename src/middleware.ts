import createMiddleware from "next-intl/middleware";
import NextAuth from "next-auth";
import { routing } from "./i18n/routing";
import { authConfig } from "./lib/auth.config";
import { NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

// Edge-safe NextAuth instance: it only decodes the session JWT, so the Prisma
// adapter in lib/auth.ts never has to load in the middleware runtime.
const { auth } = NextAuth(authConfig);

const protectedRoutes = ["/dashboard", "/booking"];
const adminRoutes = ["/admin"];
const superAdminRoutes = ["/super-admin"];

// The back office lives outside the [locale] segment, so next-intl must not
// rewrite /admin to /ar/admin.
const nonLocalizedRoutes = [...adminRoutes, ...superAdminRoutes];

const localePrefix = new RegExp(`^/(${routing.locales.join("|")})(?=/|$)`);

/**
 * Admin routes are not locale-prefixed, so the first path segment is "admin",
 * not a locale — fall back to the default locale in that case.
 */
function localeOf(pathname: string) {
  const segment = pathname.split("/")[1];
  return routing.locales.includes(segment as (typeof routing.locales)[number])
    ? segment
    : routing.defaultLocale;
}

export default auth((req) => {
  const pathname = req.nextUrl.pathname;

  // Strip locale prefix for route checking
  const pathnameWithoutLocale = pathname.replace(localePrefix, "");

  // Check if route needs auth
  const isProtected = protectedRoutes.some((r) =>
    pathnameWithoutLocale.startsWith(r)
  );
  const isAdmin = adminRoutes.some((r) =>
    pathnameWithoutLocale.startsWith(r)
  );
  const isSuperAdmin = superAdminRoutes.some((r) =>
    pathnameWithoutLocale.startsWith(r)
  );

  if (isProtected || isAdmin || isSuperAdmin) {
    const session = req.auth;
    const locale = localeOf(pathname);
    const role = session?.user?.role;

    if (!session) {
      return NextResponse.redirect(new URL(`/${locale}/login`, req.url));
    }

    if (isAdmin && role !== "ADMIN" && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL(`/${locale}`, req.url));
    }

    if (isSuperAdmin && role !== "SUPER_ADMIN") {
      return NextResponse.redirect(new URL(`/${locale}`, req.url));
    }
  }

  if (nonLocalizedRoutes.some((r) => pathname === r || pathname.startsWith(`${r}/`))) {
    return NextResponse.next();
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)",
  ],
};
