export function buildManageBookingUrl(input: { ref: string; email: string }): string {
  const params = new URLSearchParams({
    ref: input.ref.trim(),
    email: input.email.trim().toLowerCase(),
  });
  return `/manage-booking?${params.toString()}`;
}
