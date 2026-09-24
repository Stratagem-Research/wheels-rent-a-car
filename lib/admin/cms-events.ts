export const CMS_UPDATED_EVENT = "wheels-cms-updated";

export type CmsResource = "trips" | "itineraries" | "faqs" | "corporate" | "help-articles";

export function notifyCmsUpdated(resource: CmsResource): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(CMS_UPDATED_EVENT, { detail: resource }));
}
