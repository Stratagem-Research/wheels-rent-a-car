import type { VehicleImage } from "@/types/domain";

export const VEHICLE_MEDIA_VIEWS = ["front", "back", "interior", "gallery"] as const;
export type VehicleMediaView = (typeof VEHICLE_MEDIA_VIEWS)[number];

export type VehicleMediaItem = VehicleImage & {
  view: VehicleMediaView;
};

const SINGLETON_VIEWS = new Set<VehicleMediaView>(["front", "back", "interior"]);

const VIEW_ORDER: Record<VehicleMediaView, number> = {
  front: 0,
  back: 1,
  interior: 2,
  gallery: 3,
};

function isView(value: unknown): value is VehicleMediaView {
  return value === "front" || value === "back" || value === "interior" || value === "gallery";
}

function asImage(rec: Record<string, unknown>, view: VehicleMediaView): VehicleMediaItem | null {
  const url = typeof rec.url === "string" ? rec.url.trim() : "";
  if (!url) return null;
  return {
    url,
    alt: typeof rec.alt === "string" && rec.alt.trim() ? rec.alt.trim() : "Vehicle",
    width: typeof rec.width === "number" && rec.width > 0 ? rec.width : 1600,
    height: typeof rec.height === "number" && rec.height > 0 ? rec.height : 900,
    view,
  };
}

/** Normalize stored `vehicle_metadata.media` JSON. Untagged items: first → front, rest → gallery. */
export function parseVehicleMedia(raw: unknown): VehicleMediaItem[] {
  if (!Array.isArray(raw)) return [];
  const items: VehicleMediaItem[] = [];
  let usedFrontFallback = false;
  for (const entry of raw) {
    if (!entry || typeof entry !== "object") continue;
    const rec = entry as Record<string, unknown>;
    const view = isView(rec.view) ? rec.view : usedFrontFallback ? "gallery" : "front";
    if (!isView(rec.view) && view === "front") usedFrontFallback = true;
    const item = asImage(rec, view);
    if (item) items.push(item);
  }
  return coerceSingletonViews(items);
}

function coerceSingletonViews(items: VehicleMediaItem[]): VehicleMediaItem[] {
  const seen = new Set<VehicleMediaView>();
  return items.map((item) => {
    if (!SINGLETON_VIEWS.has(item.view)) return item;
    if (seen.has(item.view)) return { ...item, view: "gallery" };
    seen.add(item.view);
    return item;
  });
}

export function mediaSlot(media: VehicleMediaItem[], view: Exclude<VehicleMediaView, "gallery">): VehicleMediaItem | undefined {
  return media.find((item) => item.view === view);
}

export function galleryMedia(media: VehicleMediaItem[]): VehicleMediaItem[] {
  return media.filter((item) => item.view === "gallery");
}

export function setMediaSlot(
  media: VehicleMediaItem[],
  view: Exclude<VehicleMediaView, "gallery">,
  next: Omit<VehicleMediaItem, "view"> | null,
): VehicleMediaItem[] {
  const without = media.filter((item) => item.view !== view);
  if (!next) return without;
  return coerceSingletonViews([{ ...next, view }, ...without]);
}

export function setGalleryItem(
  media: VehicleMediaItem[],
  index: number,
  next: Omit<VehicleMediaItem, "view"> | null,
): VehicleMediaItem[] {
  const gallery = galleryMedia(media);
  const rest = media.filter((item) => item.view !== "gallery");
  if (next === null) {
    return [...rest, ...gallery.filter((_, i) => i !== index)];
  }
  const updated = gallery.map((item, i) => (i === index ? { ...next, view: "gallery" as const } : item));
  if (index >= gallery.length) updated.push({ ...next, view: "gallery" });
  return [...rest, ...updated];
}

export function addGalleryItem(media: VehicleMediaItem[], next: Omit<VehicleMediaItem, "view">): VehicleMediaItem[] {
  return [...media, { ...next, view: "gallery" }];
}

export function sortVehicleMedia(media: VehicleMediaItem[]): VehicleMediaItem[] {
  return [...media].sort((a, b) => VIEW_ORDER[a.view] - VIEW_ORDER[b.view]);
}

export function toPublicVehicleImages(media: VehicleMediaItem[]): VehicleImage[] {
  return sortVehicleMedia(media).map(({ url, alt, width, height }) => ({ url, alt, width, height }));
}
