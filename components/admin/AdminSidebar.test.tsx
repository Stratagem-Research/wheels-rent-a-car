import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AdminMobileBar, AdminSidebar } from "./AdminSidebar";

const pathname = vi.hoisted(() => ({ current: "/admin" }));

vi.mock("next/navigation", () => ({
  usePathname: () => pathname.current,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/lib/admin/auth", () => ({
  signOut: vi.fn(),
}));

function renderSidebar() {
  return render(<AdminSidebar collapsed={false} onToggleCollapsed={vi.fn()} />);
}

describe("AdminSidebar", () => {
  it("marks only the matching car-wash item current", () => {
    pathname.current = "/admin/car-wash-bookings";
    renderSidebar();

    expect(screen.getByRole("link", { name: "Car wash bookings" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Car wash" })).not.toHaveAttribute("aria-current");
  });

  it("marks a nested route on its parent item", () => {
    pathname.current = "/admin/trips/new";
    renderSidebar();

    expect(screen.getByRole("link", { name: "Trips" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute("aria-current");
  });

  it("uses sentence-case labels on full-width rows", () => {
    pathname.current = "/admin";
    renderSidebar();

    const bookings = screen.getByRole("link", { name: "Bookings" });
    expect(bookings).toHaveTextContent("Bookings");
    expect(bookings.className).toContain("body-sm");
    expect(bookings.className).toContain("w-full");
  });
});

describe("AdminMobileBar", () => {
  it("groups sections and selects the active route", () => {
    pathname.current = "/admin/contact";
    render(<AdminMobileBar />);

    const select = screen.getByRole("combobox", { name: "Admin sections" });
    expect(select).toHaveValue("/admin/contact");
    expect(screen.getByRole("group", { name: "Data" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Content" })).toBeInTheDocument();
  });
});
