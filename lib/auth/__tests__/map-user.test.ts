import { describe, expect, it } from "vitest";
import type { User } from "@supabase/supabase-js";
import { toDomainUser } from "@/lib/auth/map-user";

describe("auth/map-user", () => {
  it("maps Supabase user metadata to domain user", () => {
    const supabaseUser = {
      id: "user_1",
      email: "ada@example.com",
      created_at: "2026-05-26T00:00:00.000Z",
      email_confirmed_at: "2026-05-26T00:00:00.000Z",
      user_metadata: {
        first_name: "Ada",
        last_name: "Lovelace",
        phone: "+96170123456",
        country: "LB",
        marketing_opt_in: true,
        whatsapp_opt_in: false,
      },
    } as unknown as User;

    const mapped = toDomainUser(supabaseUser);
    expect(mapped).toMatchObject({
      id: "user_1",
      firstName: "Ada",
      lastName: "Lovelace",
      email: "ada@example.com",
      emailVerified: true,
      phone: "+96170123456",
      country: "LB",
      preferences: {
        marketing: true,
        whatsappUpdates: false,
      },
    });
  });
});
