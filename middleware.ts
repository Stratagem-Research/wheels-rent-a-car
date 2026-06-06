import { NextResponse, type NextRequest } from "next/server";

/**
 * Middleware: two concerns rolled into one matcher.
 *
 * 1. Maintenance mode (15_legal_and_utility.md): when
 *    NEXT_PUBLIC_MAINTENANCE_MODE === "true", every request except admins
 *    (cookie `wheels.admin=1`) and a small allow-list is rewritten to
 *    /maintenance with HTTP 503 + Retry-After.
 *
 * 2. Auth gating (12_account.md): /account/* requires a session cookie;
 *    redirect to /login with redirect= param when missing.
 */

const SESSION_COOKIE = "wheels.session";
const ADMIN_COOKIE = "wheels.admin";

const MAINTENANCE_ALLOWLIST = [
  "/maintenance",
  "/_next",
  "/api/health",
  "/favicon",
  "/images",
  "/mockServiceWorker.js",
];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Maintenance mode — env-var flip routes everyone except admins to /maintenance.
  if (
    process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true" &&
    req.cookies.get(ADMIN_COOKIE)?.value !== "1" &&
    !MAINTENANCE_ALLOWLIST.some((p) => pathname.startsWith(p))
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

  // Auth gating for /account/*.
  if (pathname.startsWith("/account")) {
    const session = req.cookies.get(SESSION_COOKIE);
    const hasSupabaseAuthCookie = req.cookies
      .getAll()
      .some((cookie) => cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token"));
    if (!session?.value || !hasSupabaseAuthCookie) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("redirect", pathname + search);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Admin dashboard — keep out of indexes and gate by server session cookie.
  if (pathname.startsWith("/admin")) {
    const isLoginPath = pathname === "/admin/login";
    const hasAdminSession = Boolean(req.cookies.get("wheels.admin.session")?.value);
    if (!isLoginPath && !hasAdminSession) {
      const loginUrl = new URL("/admin/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
    if (isLoginPath && hasAdminSession) {
      const adminUrl = new URL("/admin", req.url);
      return NextResponse.redirect(adminUrl);
    }
    const res = NextResponse.next();
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }

  return NextResponse.next();
}

export const config = {
  // Skip Next internals + static assets — everything else goes through.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|mockServiceWorker.js).*)"],
};
