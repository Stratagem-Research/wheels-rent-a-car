/** Read admin CSRF token from document cookie for mutating /api/admin/* calls. */
export function getAdminCsrfHeader(): Record<string, string> {
  if (typeof document === "undefined") return {};
  const match = document.cookie.match(/(?:^|;\s*)wheels\.admin\.csrf=([^;]+)/);
  if (!match) return {};
  return { "x-admin-csrf": decodeURIComponent(match[1] ?? "") };
}
