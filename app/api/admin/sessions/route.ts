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
import { writeAdminAuditLog } from "@/lib/supabase/admin-repository";

export async function GET(request: Request) {
  const session = readAdminSession(request);
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ user: { username: session.username, role: session.role } });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    username?: string;
    password?: string;
  } | null;
  if (!body?.username || !body.password) {
    return NextResponse.json({ message: "Username and password are required." }, { status: 400 });
  }
  const identity = authenticateAdminCredentials(body.username, body.password);
  if (!identity) {
    return NextResponse.json({ message: "Invalid username or password." }, { status: 401 });
  }
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
