import { describe, expect, it } from "vitest";
import {
  assertCmsMediaFile,
  CMS_MEDIA_MAX_BYTES,
  storagePathFromPublicUrl,
} from "@/lib/supabase/cms-media-storage";

describe("cms-media-storage", () => {
  it("accepts allowed image types under 5MB", () => {
    expect(assertCmsMediaFile({ size: 1024, type: "image/jpeg" })).toEqual({ ok: true });
    expect(assertCmsMediaFile({ size: 1024, type: "image/png" })).toEqual({ ok: true });
  });

  it("rejects pdf and oversized files", () => {
    expect(assertCmsMediaFile({ size: 1024, type: "application/pdf" }).ok).toBe(false);
    expect(assertCmsMediaFile({ size: CMS_MEDIA_MAX_BYTES + 1, type: "image/png" }).ok).toBe(
      false,
    );
  });

  it("extracts storage path from public URL", () => {
    const url =
      "https://xyz.supabase.co/storage/v1/object/public/cms-vehicle-media/vehicles/wiz-1/123.jpg";
    expect(storagePathFromPublicUrl(url, "vehicle")).toBe("vehicles/wiz-1/123.jpg");
    expect(storagePathFromPublicUrl(url, "team")).toBeNull();
  });
});
