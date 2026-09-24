import { z } from "zod";

const localizedStringSchema = z.object({
  en: z.string().min(1),
  ar: z.string().optional(),
  fr: z.string().optional(),
});

const localizedStringArraySchema = z.object({
  en: z.array(z.string()),
  ar: z.array(z.string()).optional(),
  fr: z.array(z.string()).optional(),
});

const tripImageSchema = z.object({
  src: z.string().min(1),
  alt: localizedStringSchema,
  width: z.number().int().positive(),
  height: z.number().int().positive(),
});

export const tripSchema = z.object({
  slug: z.string().min(1),
  title: localizedStringSchema,
  excerpt: localizedStringSchema,
  coverImage: tripImageSchema,
  meta: localizedStringSchema,
  region: z.enum(["mountains", "coast", "bekaa", "cultural", "north", "south"]),
  body: localizedStringSchema,
  suggestedVehicleCategory: z.enum([
    "economy",
    "compact",
    "sedan",
    "suv",
    "luxury",
    "4x4",
    "7-seater",
    "convertible",
  ]),
  tags: localizedStringArraySchema,
  publishedAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const itineraryScheduleItemSchema = z.object({
  time: z.string().min(1),
  title: localizedStringSchema,
  body: localizedStringSchema.optional(),
});

export const itinerarySchema = z.object({
  slug: z.string().min(1),
  title: localizedStringSchema,
  excerpt: localizedStringSchema,
  coverImage: tripImageSchema,
  category: z.enum(["day-trip", "multi-day", "cultural", "wine", "north", "south"]),
  duration: localizedStringSchema,
  priceFromCents: z.number().int().nonnegative(),
  highlights: localizedStringArraySchema,
  schedule: z.array(itineraryScheduleItemSchema),
  vehicleClass: z.enum(["sedan", "suv", "van"]),
  updatedAt: z.string().min(1),
});

export const faqEntrySchema = z.object({
  id: z.string().min(1),
  group: z.string().min(1),
  question: localizedStringSchema,
  answer: localizedStringSchema,
});

export const faqGroupSchema = z.object({
  id: z.string().min(1),
  title: localizedStringSchema,
  entries: z.array(faqEntrySchema),
});

export const corporateTierSchema = z.object({
  id: z.string().min(1),
  name: localizedStringSchema,
  tagline: localizedStringSchema,
  perDayCents: z.number().int().nonnegative().nullable(),
  fleetSize: localizedStringSchema,
  inclusions: localizedStringArraySchema,
  popular: z.boolean().optional(),
  ctaLabel: localizedStringSchema.optional(),
});

export const tripPayloadSchema = z.object({ items: z.array(tripSchema) });
export const itineraryPayloadSchema = z.object({ items: z.array(itinerarySchema) });
export const faqPayloadSchema = z.object({ items: z.array(faqGroupSchema) });
export const corporatePayloadSchema = z.object({ items: z.array(corporateTierSchema) });

export const helpArticleSectionSchema = z.object({
  id: z.string().min(1),
  heading: localizedStringSchema,
  body: localizedStringSchema,
});

export const helpArticleSchema = z.object({
  slug: z.string().min(1),
  title: localizedStringSchema,
  intro: localizedStringSchema,
  lastUpdated: z.string().min(1),
  sections: z.array(helpArticleSectionSchema),
});

export const helpArticlePayloadSchema = z.object({ item: helpArticleSchema });

export const aboutContentSchema = z.object({
  storyParagraphs: localizedStringArraySchema,
  pullQuote: localizedStringSchema,
  fleetPhilosophy: z.object({
    heading: localizedStringSchema,
    paragraphs: localizedStringArraySchema,
  }),
  stats: z.array(
    z.object({
      value: z.string(),
      label: localizedStringSchema,
    }),
  ),
  teamIntro: localizedStringSchema,
  teamDedication: localizedStringSchema,
  team: z.array(
    z.object({
      name: z.string(),
      role: localizedStringSchema,
      photo: z.string(),
      quote: localizedStringSchema.optional(),
      bio: localizedStringSchema,
      highlights: localizedStringArraySchema.optional(),
    }),
  ),
});
