import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { VehicleCard } from "./VehicleCard";
import type { Vehicle } from "@/types/domain";

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
  it("renders make, model, and 'or similar' caveat", () => {
    render(<VehicleCard vehicle={fixture} />);
    expect(screen.getByRole("heading", { name: /Toyota Yaris/i })).toBeInTheDocument();
    expect(screen.getByText(/or similar/i)).toBeInTheDocument();
  });

  it("renders the from-price in dollars", () => {
    render(<VehicleCard vehicle={fixture} />);
    expect(screen.getByText("$25")).toBeInTheDocument();
  });

  it("links back to /vehicles with ?selected=<slug> for inline expansion", () => {
    render(<VehicleCard vehicle={fixture} />);
    const links = screen.getAllByRole("link");
    expect(links.some((l) => l.getAttribute("href") === "/vehicles?selected=toyota-yaris")).toBe(
      true,
    );
  });

  it("renders the Best deal badge when set", () => {
    render(<VehicleCard vehicle={fixture} />);
    expect(screen.getByText(/Best deal/i)).toBeInTheDocument();
  });

  it("light variant uses paper surface (no ink-95 background class)", () => {
    const { container } = render(<VehicleCard vehicle={fixture} variant="light" />);
    const article = container.querySelector("article");
    expect(article?.className).toContain("bg-paper");
    expect(article?.className).not.toContain("bg-ink-95");
  });

  it("default variant uses dark Sixt surface", () => {
    const { container } = render(<VehicleCard vehicle={fixture} />);
    const article = container.querySelector("article");
    expect(article?.className).toContain("bg-ink-95");
    expect(article?.className).toContain("text-paper");
  });
});
