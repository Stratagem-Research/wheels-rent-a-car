"use client";

import * as React from "react";
import { Plus } from "lucide-react";
import { AdminImageUpload, type AdminImageUploadResult } from "@/components/admin/AdminImageUpload";
import {
  addGalleryItem,
  galleryMedia,
  mediaSlot,
  setGalleryItem,
  setMediaSlot,
  type VehicleMediaItem,
} from "@/lib/vehicles/vehicle-media";

type Slot = "front" | "back" | "interior";

const SLOTS: Array<{ view: Slot; label: string; upload: string }> = [
  { view: "front", label: "Front", upload: "Upload front" },
  { view: "back", label: "Back", upload: "Upload back" },
  { view: "interior", label: "Interior", upload: "Upload interior" },
];

function toStored(result: AdminImageUploadResult): Omit<VehicleMediaItem, "view"> {
  return {
    url: result.url,
    alt: result.alt ?? "Vehicle",
    width: result.width ?? 1600,
    height: result.height ?? 900,
  };
}

export function VehicleMediaFields({
  entityId,
  media,
  onChange,
}: {
  entityId: string;
  media: VehicleMediaItem[];
  onChange: (next: VehicleMediaItem[]) => void;
}) {
  const gallery = galleryMedia(media);
  const [addingGallery, setAddingGallery] = React.useState(false);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h3 className="headline-sm text-ink-100">Vehicle photos</h3>
        <p className="body-sm text-ink-60">JPEG, PNG, WebP, or AVIF · max 5 MB each.</p>
      </div>
      <div className="flex flex-wrap items-start gap-5">
        {SLOTS.map((slot) => {
          const current = mediaSlot(media, slot.view);
          return (
            <div key={slot.view} className="flex min-w-32 flex-1 basis-32 flex-col gap-2">
              <p className="label-sm text-ink-50 tracking-[0.12em] uppercase">{slot.label}</p>
              <AdminImageUpload
                kind="vehicle"
                variant="slot"
                showHint={false}
                entityId={`${entityId}-${slot.view}`}
                label={slot.upload}
                currentUrl={current?.url}
                onUploaded={(result) => onChange(setMediaSlot(media, slot.view, toStored(result)))}
                onRemoved={() => onChange(setMediaSlot(media, slot.view, null))}
              />
            </div>
          );
        })}
        {gallery.map((item, index) => (
          <div key={`${item.url}-${index}`} className="flex min-w-32 flex-1 basis-32 flex-col gap-2">
            <p className="label-sm text-ink-50 tracking-[0.12em] uppercase">Gallery {index + 1}</p>
            <AdminImageUpload
              kind="vehicle"
              variant="slot"
              showHint={false}
              entityId={`${entityId}-gallery-${index}`}
              label="Upload gallery image"
              currentUrl={item.url}
              onUploaded={(result) => onChange(setGalleryItem(media, index, toStored(result)))}
              onRemoved={() => onChange(setGalleryItem(media, index, null))}
            />
          </div>
        ))}
        {addingGallery ? (
          <div className="flex min-w-32 flex-1 basis-32 flex-col gap-2">
            <p className="label-sm text-ink-50 tracking-[0.12em] uppercase">Gallery</p>
            <AdminImageUpload
              kind="vehicle"
              variant="slot"
              showHint={false}
              entityId={`${entityId}-gallery-new`}
              label="Upload gallery image"
              onUploaded={(result) => {
                onChange(addGalleryItem(media, toStored(result)));
                setAddingGallery(false);
              }}
            />
            <button
              type="button"
              className="body-sm text-ink-60 hover:text-ink-100 self-start"
              onClick={() => setAddingGallery(false)}
            >
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex min-w-32 flex-1 basis-32 flex-col gap-2">
            <p className="label-sm text-ink-50 tracking-[0.12em] uppercase">Gallery</p>
            <button
              type="button"
              aria-label="Add gallery image"
              className="border-border text-ink-60 hover:border-ink-40 hover:text-ink-100 flex aspect-square w-full min-h-32 items-center justify-center rounded-xl border border-dashed"
              onClick={() => setAddingGallery(true)}
            >
              <Plus className="size-8" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
