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
  it("renders brand and model as the title", () => {
    renderCard(<VehicleCard vehicle={{ ...fixture, title: "Custom Name" }} />);
    expect(screen.getByText("Toyota Yaris")).toBeInTheDocument();
    expect(screen.queryByText("Custom Name")).not.toBeInTheDocument();
  });

  it("hides the class chip when no category is set", () => {
    renderCard(<VehicleCard vehicle={fixture} />);
    expect(screen.queryByText(/economy sedan/i)).not.toBeInTheDocument();
  });

  it("shows the admin category as the class chip", () => {
    renderCard(<VehicleCard vehicle={{ ...fixture, classLabel: "Economy sedan" }} />);
    expect(screen.getByText("Economy sedan")).toBeInTheDocument();
  });

  it("renders the from-price in dollars", () => {
    renderCard(<VehicleCard vehicle={fixture} />);
    expect(screen.getByText("$25")).toBeInTheDocument();
  });

  it("links back to /vehicles with ?selected=<id> for inline expansion", () => {
    renderCard(<VehicleCard vehicle={fixture} />);
    const links = screen.getAllByRole("link");
    expect(links.some((l) => l.getAttribute("href") === "/vehicles?selected=test-1")).toBe(true);
  });

  it("shows next and previous photo controls when there are multiple images", () => {
    renderCard(
      <VehicleCard
        vehicle={{
          ...fixture,
          images: [
            fixture.images[0]!,
            { ...fixture.images[0]!, url: "/images/placeholder-vehicle.svg", alt: "Rear" },
          ],
        }}
      />,
    );
    expect(screen.getByRole("button", { name: /next photo/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /previous photo/i })).toBeInTheDocument();
  });

  it("hides photo controls when there is only one image", () => {
    renderCard(<VehicleCard vehicle={fixture} />);
    expect(screen.queryByRole("button", { name: /next photo/i })).not.toBeInTheDocument();
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
