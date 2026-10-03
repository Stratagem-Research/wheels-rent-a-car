import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import {
  assertAdminCsrf,
  authenticateAdminCredentials,
  clearAdminAuthCookies,
  createAdminSessionToken,
  readAdminSession,
  setAdminAuthCookies,
} from "@/lib/server/admin-auth";
import {
  adminLoginClientKey,
  checkAdminLoginAllowed,
  checkAdminUsernameAllowed,
  clearAdminLoginFailures,
  clearAdminUsernameFailures,
  recordAdminLoginFailure,
  recordAdminUsernameFailure,
} from "@/lib/server/admin-login-throttle";
import { writeAdminAuditLog } from "@/lib/supabase/admin-repository";

export async function GET(request: Request) {
  const session = readAdminSession(request);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ user: { username: session.username, role: session.role } });
}

export async function POST(request: Request) {
  const clientKey = adminLoginClientKey(request);
  const throttle = checkAdminLoginAllowed(clientKey);
  if (!throttle.allowed) {
    return NextResponse.json(
      { message: "Too many failed attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(throttle.retryAfterSeconds) } },
    );
  }

  const body = (await request.json().catch(() => null)) as {
    username?: string;
    password?: string;
  } | null;
  if (!body?.username || !body.password) {
    return NextResponse.json({ message: "Username and password are required." }, { status: 400 });
  }
  const usernameThrottle = checkAdminUsernameAllowed(body.username);
  if (!usernameThrottle.allowed) {
    return NextResponse.json(
      { message: "Too many failed attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(usernameThrottle.retryAfterSeconds) } },
    );
  }
  const identity = authenticateAdminCredentials(body.username, body.password);
  if (!identity) {
    const clientLocked = recordAdminLoginFailure(clientKey);
    const usernameLocked = recordAdminUsernameFailure(body.username);
    await writeAdminAuditLog({
      actor: body.username.trim().slice(0, 80),
      role: "ops-admin",
      resource: "admin_session",
      action: clientLocked || usernameLocked ? "login_locked_out" : "login_failed",
      details: { client: clientKey },
    }).catch(() => undefined);
    return NextResponse.json({ message: "Invalid username or password." }, { status: 401 });
  }
  clearAdminLoginFailures(clientKey);
  clearAdminUsernameFailures(identity.username);
  const sessionToken = createAdminSessionToken(identity.username, identity.role);
  const csrfToken = randomUUID().replace(/-/g, "");
  const response = NextResponse.json({ ok: true, user: identity });
  setAdminAuthCookies(response, sessionToken, csrfToken);
  await writeAdminAuditLog({
    actor: identity.username,
    role: identity.role,
    resource: "admin_session",
    action: "login",
  }).catch(() => undefined);
  return response;
}

export async function DELETE(request: Request) {
  const session = readAdminSession(request);
  if (!session) {
    const response = NextResponse.json({ ok: true });
    clearAdminAuthCookies(response);
    return response;
  }
  if (!assertAdminCsrf(request)) {
    return NextResponse.json({ message: "CSRF check failed." }, { status: 403 });
  }
  const response = NextResponse.json({ ok: true });
  clearAdminAuthCookies(response);
  await writeAdminAuditLog({
    actor: session.username,
    role: session.role,
    resource: "admin_session",
    action: "logout",
  }).catch(() => undefined);
  return response;
}
