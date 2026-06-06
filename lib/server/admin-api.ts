import { NextResponse } from "next/server";
import type { AdminRole, AdminSession } from "@/lib/server/admin-auth";
import { assertAdminCsrf, readAdminSession } from "@/lib/server/admin-auth";

export function requireAdminSession(
  request: Request,
  allowedRoles?: AdminRole[],
): { ok: true; session: AdminSession } | { ok: false; response: NextResponse } {
  const session = readAdminSession(request);
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
    };
  }
  if (allowedRoles && !allowedRoles.includes(session.role)) {
    return {
      ok: false,
      response: NextResponse.json({ message: "Forbidden" }, { status: 403 }),
    };
  }
  return { ok: true, session };
}

export function requireAdminCsrf(request: Request): NextResponse | null {
  if (!assertAdminCsrf(request)) {
    return NextResponse.json({ message: "CSRF check failed." }, { status: 403 });
  }
  return null;
}
