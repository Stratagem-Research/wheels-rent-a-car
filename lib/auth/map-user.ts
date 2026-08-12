import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { User } from "@/types/domain";

export function toDomainUser(user: SupabaseUser): User {
  const metadata = user.user_metadata ?? {};
  const firstName = asString(metadata.first_name) ?? asString(metadata.firstName) ?? "";
  const lastName = asString(metadata.last_name) ?? asString(metadata.lastName) ?? "";
  const phone = asString(metadata.phone);
  const country = asString(metadata.country) ?? "LB";
  const dob = asString(metadata.dob) ?? asString(metadata.date_of_birth);
  const marketing = asBoolean(metadata.marketing_opt_in) ?? false;
  const whatsapp = asBoolean(metadata.whatsapp_opt_in) ?? true;

  return {
    id: user.id,
    firstName,
    lastName,
    email: user.email ?? "",
    emailVerified: Boolean(user.email_confirmed_at),
    phone: phone ?? undefined,
    dob: dob ?? undefined,
    country,
    preferences: {
      marketing,
      whatsappUpdates: whatsapp,
    },
    createdAt: user.created_at ?? new Date().toISOString(),
  };
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function asBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}
