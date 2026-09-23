import { notFound } from "next/navigation";

/**
 * `/dev/*` holds the internal component gallery. It is a local development
 * aid only — never part of the public site — so the whole subtree 404s
 * outside development.
 */
export default function DevLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return <>{children}</>;
}
