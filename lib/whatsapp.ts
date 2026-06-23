/**
 * WhatsApp deep-link helpers. Per 00_global.md §6, the FAB and inline
 * WhatsApp CTAs across the site use context-aware pre-filled messages.
 *
 * The WHATSAPP_NUMBER is the operations team's WhatsApp Business number —
 * change once here, propagate everywhere.
 */

export const WHATSAPP_NUMBER = "9613XXXXXXX"; // placeholder, no leading "+"

export type WhatsAppContext =
  | "default"
  | "fleet"
  | "pdp"
  | "select-vehicle"
  | "checkout"
  | "confirmation";

export interface WhatsAppContextDetails {
  /** Vehicle model name (PDP context). */
  model?: string;
  /** Booking reference (confirmation context). */
  ref?: string;
  /** Pickup label e.g. "Beirut Airport" (select-vehicle context). */
  pickup?: string;
  /** Return label (select-vehicle context). */
  return?: string;
}

export function whatsAppMessage(
  context: WhatsAppContext,
  details: WhatsAppContextDetails = {},
): string {
  switch (context) {
    case "fleet":
      return "Hi Wheels, I'm browsing your fleet and would like some help.";
    case "pdp":
      return `Hi Wheels, I'm interested in the ${details.model ?? "car"}.`;
    case "select-vehicle":
      return `Hi Wheels, I need help choosing a car${details.pickup && details.return ? ` for ${details.pickup} → ${details.return}` : ""}.`;
    case "checkout":
      return "Hi Wheels, I'm completing a booking and need help.";
    case "confirmation":
      return `Hi Wheels, my booking ref is ${details.ref ?? ""}. I have a question.`;
    case "default":
    default:
      return "Hi Wheels, I have a question about renting a car.";
  }
}

export function whatsAppHref(
  context: WhatsAppContext,
  details: WhatsAppContextDetails = {},
): string {
  const message = whatsAppMessage(context, details);
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
