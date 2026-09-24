import type { Branch } from "@/types/domain";

/**
 * Wheels has one physical branch, Hazmieh, plus a meet-and-greet pickup
 * point at Beirut Rafic Hariri International Airport (BEY). The airport
 * entry is a logical location rather than a separate counter: the same
 * Hazmieh team meets travellers at arrivals on request.
 */
export const BRANCHES: Branch[] = [
  {
    id: "br-hazmieh",
    slug: "hazmieh",
    name: "Wheels Hazmieh",
    address:
      "Hazmieh Gallery Semaan, facing Sea Sweet, next to Lancaster Tamar Hotel, Beirut, Lebanon",
    city: "Hazmieh",
    lat: 33.8693,
    lng: 35.5398,
    phone: "05 959 860",
    whatsapp: "+961 3 337 228",
    hours: [
      { day: 1, open: "08:00", close: "20:00" },
      { day: 2, open: "08:00", close: "20:00" },
      { day: 3, open: "08:00", close: "20:00" },
      { day: 4, open: "08:00", close: "20:00" },
      { day: 5, open: "08:00", close: "20:00" },
      { day: 6, open: "09:00", close: "18:00" },
      { day: 0, open: "10:00", close: "16:00" },
    ],
    isAirport: false,
  },
  {
    id: "br-bey-airport",
    slug: "bey-airport",
    name: "Beirut Airport (BEY)",
    address: "Beirut Rafic Hariri International Airport, Arrivals meet & greet",
    city: "Beirut",
    lat: 33.8209,
    lng: 35.4884,
    phone: "05 959 860",
    whatsapp: "+961 3 337 228",
    // Airport meet-and-greet is on call any time a flight lands, same staff
    // as Hazmieh, just dispatched on demand.
    hours: [
      { day: 1, open: "00:00", close: "23:59" },
      { day: 2, open: "00:00", close: "23:59" },
      { day: 3, open: "00:00", close: "23:59" },
      { day: 4, open: "00:00", close: "23:59" },
      { day: 5, open: "00:00", close: "23:59" },
      { day: 6, open: "00:00", close: "23:59" },
      { day: 0, open: "00:00", close: "23:59" },
    ],
    isAirport: true,
  },
];
