/**
 * Static content for /about. CMS-driven in production per 09_about.md;
 * stubbed here as typed data so the page can render without a backend.
 */

export interface TeamMember {
  name: string;
  role: string;
  photo: string;
  quote?: string;
}

export interface Stat {
  value: string;
  label: string;
}

export const ABOUT_STORY_PARAGRAPHS = [
  "Wheels was founded in Beirut by a family of automotive obsessives who couldn't find a rental experience worth the price in their own city. Inbound tourists were handed dusty keys; locals had to argue at the counter; expats juggled three apps to find a clean car.",
  "We started small — twelve cars and a WhatsApp number Marc answered personally. Today we run our fleet out of one hub in Hazmieh, with the same ethos: clean cars, honest pricing, real humans on the other end of every message.",
  "Premium doesn't mean expensive — it means everything that should work, works. The Yaris is rented and returned the same day, perfectly. The Tahoe arrives at your hotel valet on time. The booking confirmation reads like a friend wrote it, because one did.",
];

export const ABOUT_PULL_QUOTE =
  "Premium isn't a price point. It's the absence of things going wrong.";

export const ABOUT_STATS: Stat[] = [
  { value: "1,200+", label: "rentals last year" },
  { value: "50+", label: "vehicles in fleet" },
  { value: "5★", label: "Google reviews" },
  { value: "24/7", label: "WhatsApp support" },
];

export const ABOUT_TEAM: TeamMember[] = [
  {
    name: "Marc Khamis",
    role: "Founder & CEO",
    photo: "/images/team/placeholder.svg",
    quote: "Every car leaves our lot the way I'd want it to arrive.",
  },
  {
    name: "Operations Lead",
    role: "Head of Operations",
    photo: "/images/team/placeholder.svg",
  },
  {
    name: "Customer Experience",
    role: "Head of CX",
    photo: "/images/team/placeholder.svg",
    quote: "WhatsApp first. Always.",
  },
];

export const FLEET_PHILOSOPHY = {
  heading: "Why our fleet is different.",
  paragraphs: [
    "We cap every vehicle at three years of age. Past that, it's sold or retired — not pushed onto the next renter.",
    "Cars are inspected by a certified mechanic every 5,000 km and detailed between every rental. Tyres rotate on a calendar, not by complaint.",
    "We choose models for Lebanese roads: enough ground clearance for the mountain pass to Faqra, enough comfort for the long drive to Tyre, enough boot for a weekend in the Cedars.",
  ],
};
