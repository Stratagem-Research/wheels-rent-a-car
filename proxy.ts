import { NextResponse, type NextRequest } from "next/server";
import { isAppLocale } from "@/i18n/routing";

/**
 * Proxy: auth + maintenance + locale normalization.
 *
 * Next.js 16 deprecates `middleware.ts` in favor of `proxy.ts`.
 */

const SESSION_COOKIE = "wheels.session";
const ADMIN_COOKIE = "wheels.admin";

/** Supabase session cookie, including chunked `sb-*-auth-token.0` variants. */
const SB_SESSION_COOKIE = /^sb-.+-auth-token(?:\.\d+)?$/;

const MAINTENANCE_ALLOWLIST = [
  "/maintenance",
  "/_next",
  "/api/health",
  "/favicon",
  "/images",
];

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const { strippedPath, hadLocalePrefix } = stripLocalePrefix(pathname);

  // Normalize legacy locale-prefixed URLs (/en/*, /ar/*, /fr/*) to unprefixed URLs.
  if (hadLocalePrefix) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.pathname = strippedPath;
    return NextResponse.redirect(redirectUrl);
  }

  // Maintenance mode — env-var flip routes everyone except admins to /maintenance.
  if (
    process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true" &&
    req.cookies.get(ADMIN_COOKIE)?.value !== "1" &&
    !MAINTENANCE_ALLOWLIST.some((p) => strippedPath.startsWith(p))
  ) {
    const rewriteUrl = req.nextUrl.clone();
    rewriteUrl.pathname = "/maintenance";
    rewriteUrl.search = "";
    const response = NextResponse.rewrite(rewriteUrl);
    response.headers.set("Retry-After", "1800");
    // 503 status reaches search engines so they back off temporarily.
    return new NextResponse(response.body, {
      status: 503,
      headers: response.headers,
    });
  }

  const hasSession =
    Boolean(req.cookies.get(SESSION_COOKIE)?.value) &&
    req.cookies.getAll().some((cookie) => SB_SESSION_COOKIE.test(cookie.name));

  // Auth gating for /account/*.
  if (strippedPath.startsWith("/account")) {
    if (!hasSession) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", strippedPath + search);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Keep already-signed-in users out of the sign-in/sign-up pages. Note:
  // /reset-password is intentionally excluded — recovery links land there
  // *with* a session so the user can set a new password.
  if ((strippedPath === "/login" || strippedPath === "/register") && hasSession) {
    return NextResponse.redirect(new URL("/account", req.url));
  }

  // Admin dashboard — keep out of indexes and gate by server session cookie.
  if (strippedPath.startsWith("/admin")) {
    const isLoginPath = strippedPath === "/admin/login";
    const hasAdminSession = Boolean(req.cookies.get("wheels.admin.session")?.value);
    if (!isLoginPath && !hasAdminSession) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    if (isLoginPath && hasAdminSession) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }

  return NextResponse.next();
}

export const config = {
  // Skip Next internals + static assets — everything else goes through.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

function stripLocalePrefix(pathname: string): {
  strippedPath: string;
  hadLocalePrefix: boolean;
} {
  const segments = pathname.split("/");
  const maybeLocale = segments[1] ?? "";
  if (isAppLocale(maybeLocale)) {
    const stripped = pathname.slice(`/${maybeLocale}`.length) || "/";
    return {
      strippedPath: stripped.startsWith("/") ? stripped : `/${stripped}`,
      hadLocalePrefix: true,
    };
  }
  return { strippedPath: pathname, hadLocalePrefix: false };
}
