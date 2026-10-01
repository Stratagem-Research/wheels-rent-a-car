import { describe, expect, it } from "vitest";
import { detectLicenceScanFile } from "@/lib/server/licence-scan-file";

describe("detectLicenceScanFile", () => {
  it("accepts JPEG, PNG, WebP, and PDF signatures", () => {
    expect(detectLicenceScanFile(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0]))).toEqual({
      contentType: "image/jpeg",
      extension: "jpg",
    });
    expect(
      detectLicenceScanFile(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00])),
    ).toEqual({ contentType: "image/png", extension: "png" });
    const webp = new Uint8Array(12);
    webp.set([0x52, 0x49, 0x46, 0x46], 0);
    webp.set([0x57, 0x45, 0x42, 0x50], 8);
    expect(detectLicenceScanFile(webp)).toEqual({
      contentType: "image/webp",
      extension: "webp",
    });
    expect(detectLicenceScanFile(Uint8Array.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]))).toEqual({
      contentType: "application/pdf",
      extension: "pdf",
    });
  });

  it("rejects an empty type, a spoofed MIME, and a truncated signature", () => {
    expect(detectLicenceScanFile(new Uint8Array())).toBeNull();
    expect(detectLicenceScanFile(Uint8Array.from([0x4d, 0x5a, 0x90, 0x00]))).toBeNull();
    expect(detectLicenceScanFile(Uint8Array.from([0xff, 0xd8]))).toBeNull();
    expect(detectLicenceScanFile(Uint8Array.from([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x41, 0x56, 0x49, 0x20]))).toBeNull();
  });
});
