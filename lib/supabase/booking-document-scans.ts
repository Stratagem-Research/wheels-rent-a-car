import { getSupabaseAdminClient } from "@/lib/supabase/admin";

export type BookingDocumentScans = {
  licenceFrontPath?: string;
  licenceBackPath?: string;
  licenceNumber?: string;
  licenceIssue?: string;
  licenceExpiry?: string;
  licenceCountry?: string;
  additionalFirstName?: string;
  additionalLastName?: string;
  additionalFrontPath?: string;
  additionalBackPath?: string;
};

function firstPath(...values: unknown[]): string | undefined {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return undefined;
}

function merge(into: BookingDocumentScans, row: Record<string, unknown>): BookingDocumentScans {
  return {
    licenceFrontPath: into.licenceFrontPath ?? firstPath(row.driver_licence_front_path),
    licenceBackPath: into.licenceBackPath ?? firstPath(row.driver_licence_back_path),
    licenceNumber: into.licenceNumber ?? firstPath(row.driver_licence_number),
    licenceIssue: into.licenceIssue ?? firstPath(row.driver_licence_issue),
    licenceExpiry: into.licenceExpiry ?? firstPath(row.driver_licence_expiry),
    licenceCountry: into.licenceCountry ?? firstPath(row.driver_country),
    additionalFirstName: into.additionalFirstName ?? firstPath(row.additional_driver_first_name),
    additionalLastName: into.additionalLastName ?? firstPath(row.additional_driver_last_name),
    additionalFrontPath: into.additionalFrontPath ?? firstPath(row.additional_driver_front_path),
    additionalBackPath: into.additionalBackPath ?? firstPath(row.additional_driver_back_path),
  };
}

/** Licence / additional-driver scans stored on guest or account booking rows. */
export async function findBookingDocumentScans(options: {
  userId?: string | null;
  email?: string | null;
  bookingReference?: string | null;
}): Promise<BookingDocumentScans> {
  try {
    const supabase = getSupabaseAdminClient();
    const queries = [];
    if (options.bookingReference) {
      queries.push(
        supabase.from("user_bookings").select("*").eq("booking_reference", options.bookingReference).limit(5),
        supabase.from("guest_booking_index").select("*").eq("booking_reference", options.bookingReference).limit(5),
      );
    }
    if (options.userId) {
      queries.push(
        supabase
          .from("user_bookings")
          .select("*")
          .eq("user_id", options.userId)
          .order("created_at", { ascending: false })
          .limit(20),
      );
    }
    if (options.email) {
      queries.push(
        supabase
          .from("guest_booking_index")
          .select("*")
          .eq("email", options.email.trim().toLowerCase())
          .order("created_at", { ascending: false })
          .limit(20),
      );
    }
    if (queries.length === 0) return {};

    const results = await Promise.all(queries);
    let scans: BookingDocumentScans = {};
    for (const result of results) {
      for (const row of result.data ?? []) {
        scans = merge(scans, row as Record<string, unknown>);
      }
    }
    return scans;
  } catch {
    return {};
  }
}

export async function signedStorageUrl(path: string | null | undefined): Promise<string | undefined> {
  if (!path) return undefined;
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase.storage.from("user-documents").createSignedUrl(path, 3600);
  return data?.signedUrl;
}

/** Attach viewable licence scan URLs for an additional driver stored as paths. */
export async function withSignedAdditionalDriverScans<T extends { additionalDriver?: { firstName: string; lastName: string; licenceFrontUrl?: string; licenceBackUrl?: string; licenceFrontPath?: string; licenceBackPath?: string } }>(
  booking: T,
): Promise<T> {
  const extra = booking.additionalDriver;
  if (!extra) return booking;
  const [licenceFrontUrl, licenceBackUrl] = await Promise.all([
    extra.licenceFrontUrl ? Promise.resolve(extra.licenceFrontUrl) : signedStorageUrl(extra.licenceFrontPath),
    extra.licenceBackUrl ? Promise.resolve(extra.licenceBackUrl) : signedStorageUrl(extra.licenceBackPath),
  ]);
  if (!licenceFrontUrl && !licenceBackUrl) return booking;
  return {
    ...booking,
    additionalDriver: {
      ...extra,
      ...(licenceFrontUrl ? { licenceFrontUrl } : {}),
      ...(licenceBackUrl ? { licenceBackUrl } : {}),
    },
  };
}
