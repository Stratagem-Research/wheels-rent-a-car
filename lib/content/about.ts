/**
 * Static content for /about. CMS-driven in production per 09_about.md;
 * stubbed here as typed data so the page can render without a backend.
 */

export interface TeamMember {
  name: string;
  role: string;
  photo: string;
  quote?: string;
  bio: string;
  highlights?: string[];
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

export const ABOUT_TEAM_INTRO =
  "Wheels is a family-built car rental company founded on trust, service, and years of experience. Behind every booking, delivery, and customer interaction is a team that works closely together to make the rental experience smooth, reliable, and personal.";

export const ABOUT_TEAM_DEDICATION =
  "This page is dedicated to Said and Mireille Krayem, whose hard work, vision, and commitment built the foundation of Wheels and continue to guide the company today.";

export const ABOUT_TEAM: TeamMember[] = [
  {
    name: "Said Krayem",
    role: "Founder and Owner",
    photo: "/images/services/chauffeur.png",
    quote: "Built from experience, guided by resilience.",
    bio: "Said Krayem is the founder and owner of Wheels. With years of experience, strong leadership, and deep knowledge of the business, he built the company from the ground up and continues to guide key decisions and long-term direction.",
    highlights: ["Founder since day one", "Leads major business decisions"],
  },
  {
    name: "Mireille Krayem",
    role: "Owner and Customer Relations Lead",
    photo: "/images/services/long-term.png",
    bio: "Mireille Krayem has been at the heart of Wheels since the beginning. She leads customer support, reservations, and high-season coordination while helping the team prepare daily operations so service stays smooth and reliable.",
    highlights: ["Customer relations leadership", "Reservations and operations planning"],
  },
  {
    name: "Elie Krayem",
    role: "Operations and Digital Transformation Lead",
    photo: "/images/services/chauffeur.png",
    quote: "Modern systems, personal service.",
    bio: "Elie Krayem oversees daily operations, team coordination, and customer service performance. He leads Wheels' shift from manual workflows to modern digital systems that improve speed, consistency, and internal communication.",
    highlights: ["Operations oversight", "Digital process modernization"],
  },
  {
    name: "Diane Krayem",
    role: "Family Team Member",
    photo: "/images/services/long-term.png",
    bio: "Diane Krayem is part of the Wheels family and supports the company whenever needed. While not involved in daily operations, she remains an important contributor within the family team.",
  },
  {
    name: "Degaul Roukoz",
    role: "Fleet Operations and VIP Client Support",
    photo: "/images/services/chauffeur.png",
    bio: "Degaul Roukoz has been part of Wheels since 2009 and has supported key client relationships across the region. He contributes across fleet checks, maintenance coordination, deliveries, returns, reservations, and VIP driving support.",
    highlights: ["Part of Wheels since 2009", "VIP and regional client support"],
  },
  {
    name: "Ilda Taha",
    role: "Front Desk and Reservations Coordinator",
    photo: "/images/services/long-term.png",
    bio: "Ilda Taha manages the front desk and prepares the daily schedule so the team starts each day ready. She handles booking records, contracts, reservation monitoring, fleet tracking, and documentation accuracy.",
    highlights: ["Front-desk lead", "Contracts and reservation operations"],
  },
  {
    name: "Taleb Zein",
    role: "Airport Delivery and Client Support",
    photo: "/images/services/chauffeur.png",
    bio: "Taleb Zein supports airport deliveries, vehicle handovers, customer requests, and day-to-day field coordination. He is known for being dependable, flexible, and ready to assist wherever needed.",
  },
  {
    name: "Jawdat Soufan",
    role: "Car Wash and Vehicle Care Specialist",
    photo: "/images/services/chauffeur.png",
    quote: "Every vehicle leaves clean and ready.",
    bio: "Jawdat Soufan, also known as Fadel or Zoro, is responsible for vehicle cleaning and preparation. With more than 30 years of vehicle-care experience, he ensures each car is presentable and customer-ready before handoff.",
    highlights: ["30+ years of vehicle care", "Detail and preparation specialist"],
  },
  {
    name: "Fadi Dagher",
    role: "Accountant",
    photo: "/images/services/chauffeur.png",
    bio: "Fadi Dagher has managed accounting and financial follow-up for Wheels since 2009. He supports the company with financial organization, reporting, and administrative continuity.",
  },
  {
    name: "Ramy Haykal",
    role: "Social Media Manager",
    photo: "/images/services/chauffeur.png",
    bio: "Ramy Haykal manages Wheels' social media presence and content planning. He helps present the brand, fleet, and customer experience consistently across digital channels.",
  },
  {
    name: "Alex and Ralph Krayem",
    role: "Social Media and Content Support",
    photo: "/images/services/chauffeur.png",
    bio: "Alex and Ralph Krayem support social content production, filming, and visual storytelling. They help bring the Wheels experience online, especially across Instagram and short-form content.",
  },
  {
    name: "Adam Abbas",
    role: "Developer",
    photo: "/images/services/chauffeur.png",
    bio: "Adam Abbas supports the company's digital presence and website development. His work helps Wheels modernize and improve the online customer experience.",
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
