import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/server/admin-api", () => ({
  requireAdminSession: vi.fn(),
  requireAdminCsrf: vi.fn(),
}));

vi.mock("@/lib/supabase/cms-media-storage", async () => {
  const actual = await vi.importActual<typeof import("@/lib/supabase/cms-media-storage")>(
    "@/lib/supabase/cms-media-storage",
  );
  return {
    ...actual,
    uploadCmsMedia: vi.fn(),
  };
});

import { requireAdminCsrf, requireAdminSession } from "@/lib/server/admin-api";
import { uploadCmsMedia } from "@/lib/supabase/cms-media-storage";
import { POST } from "@/app/api/admin/media/upload/route";

function requestWithForm(form: FormData): Request {
  return {
    formData: async () => form,
    headers: new Headers(),
  } as unknown as Request;
}

describe("POST /api/admin/media/upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireAdminSession).mockReturnValue({
      ok: true,
      session: { username: "admin", role: "ops-admin", exp: Date.now() / 1000 + 3600 },
    } as never);
    vi.mocked(requireAdminCsrf).mockReturnValue(null);
    vi.mocked(uploadCmsMedia).mockResolvedValue({
      url: "https://example.supabase.co/storage/v1/object/public/cms-vehicle-media/vehicles/a/1.jpg",
      path: "vehicles/a/1.jpg",
      bucket: "cms-vehicle-media",
    });
  });

  it("returns 401 when admin session missing", async () => {
    vi.mocked(requireAdminSession).mockReturnValue({
      ok: false,
      response: new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 }),
    } as never);

    const form = new FormData();
    form.set("kind", "vehicle");
    form.set("file", new File([new Uint8Array([1, 2, 3])], "a.jpg", { type: "image/jpeg" }));

    const res = await POST(requestWithForm(form));
    expect(res.status).toBe(401);
  });

  it("rejects non-image mime", async () => {
    const form = new FormData();
    form.set("kind", "vehicle");
    form.set("entityId", "wiz-1");
    form.set("file", new File([new Uint8Array([1, 2, 3])], "a.pdf", { type: "application/pdf" }));

    const res = await POST(requestWithForm(form));
    expect(res.status).toBe(400);
    expect(uploadCmsMedia).not.toHaveBeenCalled();
  });

  it("uploads vehicle image on happy path", async () => {
    const form = new FormData();
    form.set("kind", "vehicle");
    form.set("entityId", "wiz-1");
    form.set("file", new File([new Uint8Array([1, 2, 3])], "car.jpg", { type: "image/jpeg" }));

    const res = await POST(requestWithForm(form));
    const json = (await res.json()) as { url?: string; message?: string };
    expect(res.status).toBe(200);
    expect(json.url).toContain("cms-vehicle-media");
    expect(uploadCmsMedia).toHaveBeenCalled();
  });
});
