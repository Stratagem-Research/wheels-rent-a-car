import { NextResponse, type NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing, isAppLocale } from "@/i18n/routing";

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
const LOCALE_COOKIE = "wheels.locale";
const intlMiddleware = createIntlMiddleware(routing);

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
  const { locale, strippedPath } = stripLocale(pathname);
  const localizedPath = withLocale(locale, strippedPath);

  // Maintenance mode — env-var flip routes everyone except admins to /maintenance.
  if (
    process.env.NEXT_PUBLIC_MAINTENANCE_MODE === "true" &&
    req.cookies.get(ADMIN_COOKIE)?.value !== "1" &&
    !MAINTENANCE_ALLOWLIST.some((p) => strippedPath.startsWith(p))
  ) {
    const rewriteUrl = req.nextUrl.clone();
    rewriteUrl.pathname = withLocale(locale, "/maintenance");
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
  if (strippedPath.startsWith("/account")) {
    const session = req.cookies.get(SESSION_COOKIE);
    const hasSupabaseAuthCookie = req.cookies
      .getAll()
      .some((cookie) => cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token"));
    if (!session?.value || !hasSupabaseAuthCookie) {
      const loginUrl = new URL(withLocale(locale, "/login"), req.url);
      loginUrl.searchParams.set("redirect", localizedPath + search);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Admin dashboard — keep out of indexes and gate by server session cookie.
  if (strippedPath.startsWith("/admin")) {
    const isLoginPath = strippedPath === "/admin/login";
    const hasAdminSession = Boolean(req.cookies.get("wheels.admin.session")?.value);
    if (!isLoginPath && !hasAdminSession) {
      const loginUrl = new URL(withLocale(locale, "/admin/login"), req.url);
      return NextResponse.redirect(loginUrl);
    }
    if (isLoginPath && hasAdminSession) {
      const adminUrl = new URL(withLocale(locale, "/admin"), req.url);
      return NextResponse.redirect(adminUrl);
    }
    const res = intlMiddleware(req);
    res.cookies.set(LOCALE_COOKIE, locale, { path: "/" });
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
    return res;
  }

  const response = intlMiddleware(req);
  response.cookies.set(LOCALE_COOKIE, locale, { path: "/" });
  return response;
}

export const config = {
  // Skip Next internals + static assets — everything else goes through.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|mockServiceWorker.js).*)"],
};

function stripLocale(pathname: string): { locale: string; strippedPath: string } {
  const segments = pathname.split("/");
  const maybeLocale = segments[1] ?? "";
  if (isAppLocale(maybeLocale)) {
    const stripped = pathname.slice(`/${maybeLocale}`.length) || "/";
    return { locale: maybeLocale, strippedPath: stripped.startsWith("/") ? stripped : `/${stripped}` };
  }

  return { locale: routing.defaultLocale, strippedPath: pathname };
}

function withLocale(locale: string, path: string): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (normalized === "/") return `/${locale}`;
  return `/${locale}${normalized}`;
}
