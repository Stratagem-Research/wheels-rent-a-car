import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type CmsMediaKind = "vehicle" | "team" | "trip" | "seo";

export const CMS_MEDIA_MAX_BYTES = 5 * 1024 * 1024;
export const CMS_MEDIA_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const BUCKET_BY_KIND: Record<CmsMediaKind, string> = {
  vehicle: "cms-vehicle-media",
  team: "cms-team-photos",
  trip: "cms-trip-media",
  seo: "cms-seo-media",
};

const PREFIX_BY_KIND: Record<CmsMediaKind, string> = {
  vehicle: "vehicles",
  team: "team",
  trip: "trips",
  seo: "seo",
};

function sanitizeSegment(value: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  return cleaned || "item";
}

function extensionFor(mime: string, fileName: string): string {
  const fromName = fileName.split(".").pop()?.toLowerCase();
  if (fromName && ["jpg", "jpeg", "png", "webp", "avif"].includes(fromName)) {
    return fromName === "jpeg" ? "jpg" : fromName;
  }
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/avif") return "avif";
  return "jpg";
}

export function assertCmsMediaFile(file: {
  size: number;
  type: string;
}): { ok: true } | { ok: false; message: string } {
  if (!CMS_MEDIA_MIME_TYPES.has(file.type)) {
    return {
      ok: false,
      message: "Only JPEG, PNG, WebP, and AVIF images are allowed.",
    };
  }
  if (file.size <= 0 || file.size > CMS_MEDIA_MAX_BYTES) {
    return { ok: false, message: "Image must be between 1 byte and 5 MB." };
  }
  return { ok: true };
}

export async function uploadCmsMedia(input: {
  kind: CmsMediaKind;
  entityId: string;
  fileName: string;
  contentType: string;
  buffer: Buffer;
}): Promise<{ url: string; path: string; bucket: string }> {
  const check = assertCmsMediaFile({ size: input.buffer.byteLength, type: input.contentType });
  if (!check.ok) throw new Error(check.message);

  const bucket = BUCKET_BY_KIND[input.kind];
  const prefix = PREFIX_BY_KIND[input.kind];
  const ext = extensionFor(input.contentType, input.fileName);
  const path = `${prefix}/${sanitizeSegment(input.entityId)}/${Date.now()}.${ext}`;

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.storage.from(bucket).upload(path, input.buffer, {
    contentType: input.contentType,
    upsert: false,
  });
  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl, path, bucket };
}

export async function deleteCmsMedia(input: {
  kind: CmsMediaKind;
  path: string;
}): Promise<void> {
  const bucket = BUCKET_BY_KIND[input.kind];
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.storage.from(bucket).remove([input.path]);
  if (error) throw new Error(error.message);
}

const IMAGE_EXT = /\.(jpe?g|png|webp|avif)$/i;

async function listStoragePaths(bucket: string, prefix: string): Promise<string[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.storage.from(bucket).list(prefix, {
    limit: 1000,
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error) throw new Error(error.message);
  if (!data?.length) return [];

  const paths: string[] = [];
  for (const item of data) {
    const itemPath = prefix ? `${prefix}/${item.name}` : item.name;
    if (item.id === null) {
      paths.push(...(await listStoragePaths(bucket, itemPath)));
    } else if (IMAGE_EXT.test(item.name)) {
      paths.push(itemPath);
    }
  }
  return paths;
}

export async function listCmsMedia(
  kind: CmsMediaKind,
): Promise<Array<{ url: string; path: string }>> {
  const bucket = BUCKET_BY_KIND[kind];
  const prefix = PREFIX_BY_KIND[kind];
  const supabase = getSupabaseAdminClient();
  const paths = (await listStoragePaths(bucket, prefix)).sort((a, b) => b.localeCompare(a));
  return paths.map((path) => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return { url: data.publicUrl, path };
  });
}

/** Extract storage path from a public Supabase URL for this project's buckets. */
export function storagePathFromPublicUrl(url: string, kind: CmsMediaKind): string | null {
  const bucket = BUCKET_BY_KIND[kind];
  const marker = `/storage/v1/object/public/${bucket}/`;
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return decodeURIComponent(url.slice(idx + marker.length));
}
