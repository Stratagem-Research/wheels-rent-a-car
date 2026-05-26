import * as React from "react";

/**
 * Top-level admin layout — every `/admin/*` page reaches here. We do NOT
 * gate auth here so the sign-in page (`/admin/login`) can render
 * normally. The `(authenticated)` route group nested below handles the
 * gate. The middleware adds `X-Robots-Tag: noindex` to the whole tree.
 */
export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return <div className="bg-ink-05 min-h-screen">{children}</div>;
}
