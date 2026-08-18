import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/tests/utils/render-with-intl";
import { VehicleCard } from "./VehicleCard";
import type { Vehicle } from "@/types/domain";

// VehicleCard renders SaveVehicleButton, which needs the Next.js app router
// context (not present when unit-testing a client component in isolation).
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/vehicles",
}));

vi.mock("@/lib/api/client", () => ({
  api: {
    get: vi.fn().mockRejectedValue(new Error("unauthorized")),
    post: vi.fn().mockResolvedValue({}),
  },
}));

function renderCard(ui: ReactElement) {
  return renderWithProviders(ui);
}

const fixture: Vehicle = {
  id: "test-1",
  slug: "toyota-yaris",
  make: "Toyota",
  model: "Yaris",
  year: 2024,
  category: "economy",
  badge: "best-deal",
  transmission: "automatic",
  fuel: "petrol",
  seats: 5,
  doors: 5,
  bags: 3,
  features: [],
  images: [
    {
      url: "/images/placeholder-vehicle.svg",
      alt: "Toyota Yaris",
      width: 1080,
      height: 810,
    },
  ],
  dailyRateFromCents: 2500,
  ownsInFleet: true,
};

describe("VehicleCard", () => {
  it("shows how many units of the model are available", () => {
    renderCard(<VehicleCard vehicle={fixture} availableCount={4} />);
    expect(screen.getByText(/4 available/i)).toBeInTheDocument();
  });

  it("renders the from-price in dollars", () => {
    renderCard(<VehicleCard vehicle={fixture} />);
    expect(screen.getByText("$25")).toBeInTheDocument();
  });

  it("links back to /vehicles with ?selected=<slug> for inline expansion", () => {
    renderCard(<VehicleCard vehicle={fixture} />);
    const links = screen.getAllByRole("link");
    expect(links.some((l) => l.getAttribute("href") === "/vehicles?selected=toyota-yaris")).toBe(
      true,
    );
  });

  it("renders the Best deal badge when set", () => {
    renderCard(<VehicleCard vehicle={fixture} />);
    expect(screen.getByText(/Best deal/i)).toBeInTheDocument();
  });

  it("light variant uses paper surface (no ink-95 background class)", () => {
    const { container } = renderCard(<VehicleCard vehicle={fixture} variant="light" />);
    const article = container.querySelector("article");
    expect(article?.className).toContain("bg-paper");
    expect(article?.className).not.toContain("bg-ink-95");
  });

  it("default variant uses dark Sixt surface", () => {
    const { container } = renderCard(<VehicleCard vehicle={fixture} />);
    const article = container.querySelector("article");
    expect(article?.className).toContain("bg-ink-95");
    expect(article?.className).toContain("text-paper");
  });
});
