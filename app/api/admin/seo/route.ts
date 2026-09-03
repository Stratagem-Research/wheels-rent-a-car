import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminCsrf, requireAdminSession } from "@/lib/server/admin-api";
import {
  listAllPageSeo,
  upsertPageSeo,
  VEHICLE_PAGE_KEY_PREFIX,
} from "@/lib/supabase/seo-repository";
import { writeAdminAuditLog } from "@/lib/supabase/admin-repository";
import { getPublicVehicles } from "@/lib/server/public-content";

const LocalizedStringSchema = z.object({
  en: z.string(),
  ar: z.string().optional(),
  fr: z.string().optional(),
});

const SeoItemSchema = z.object({
  page_key: z.string().min(1),
  label: z.string().min(1),
  kind: z.enum(["page", "vehicle"]),
  meta_title: LocalizedStringSchema.nullable().optional(),
  meta_description: LocalizedStringSchema.nullable().optional(),
  og_image_url: z.string().nullable().optional(),
  canonical_url: z.string().nullable().optional(),
  noindex: z.boolean().optional().default(false),
});

const PayloadSchema = z.object({
  items: z.array(SeoItemSchema).min(1),
});

export async function GET(request: Request) {
  const auth = requireAdminSession(request, ["content-editor", "ops-admin"]);
  if (!auth.ok) return auth.response;
  try {
    const [rows, vehicles] = await Promise.all([
      listAllPageSeo(),
      getPublicVehicles().catch(() => []),
    ]);
    // One image per slug (front photo, already sorted first) — lets the
    // admin UI default a vehicle's OG image to its own photo instead of
    // requiring a separate upload.
    const imageBySlug = new Map<string, string>();
    for (const v of vehicles) {
      if (!imageBySlug.has(v.slug) && v.images[0]?.url) imageBySlug.set(v.slug, v.images[0].url);
    }
    const items = rows.map((row) => {
      if (row.kind !== "vehicle") return row;
      const slug = row.page_key.slice(VEHICLE_PAGE_KEY_PREFIX.length);
      return { ...row, vehicleImageUrl: imageBySlug.get(slug) ?? null };
    });
    return NextResponse.json({ items });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load SEO data.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const auth = requireAdminSession(request, ["content-editor", "ops-admin"]);
  if (!auth.ok) return auth.response;
  const csrfResponse = requireAdminCsrf(request);
  if (csrfResponse) return csrfResponse;

  const body = await request.json().catch(() => null);
  const parsed = PayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "Expected { items: PageSeoItem[] }." },
      { status: 400 },
    );
  }

  try {
    await upsertPageSeo(parsed.data.items);
    await writeAdminAuditLog({
      actor: auth.session.username,
      role: auth.session.role,
      resource: "page_seo",
      action: "upsert",
      details: { count: parsed.data.items.length },
    }).catch(() => undefined);
    return NextResponse.json({ ok: true, count: parsed.data.items.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save SEO data.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
