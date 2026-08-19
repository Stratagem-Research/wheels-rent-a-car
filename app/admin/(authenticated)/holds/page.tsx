import { redirect } from "next/navigation";

export default function AdminHoldsRedirect() {
  redirect("/admin/bookings");
}
