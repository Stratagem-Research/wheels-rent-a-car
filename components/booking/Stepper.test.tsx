import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl } from "@/tests/utils/render-with-intl";
import { Stepper } from "./Stepper";

describe("Stepper", () => {
  it("renders all 5 step labels", () => {
    renderWithIntl(<Stepper current={1} />);
    ["Vehicle", "Extras", "Protection", "Checkout", "Confirmation"].forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it("uses progressbar semantics with valuenow tied to current", () => {
    renderWithIntl(<Stepper current={3} />);
    const nav = screen.getByRole("progressbar");
    expect(nav).toHaveAttribute("aria-valuenow", "3");
    expect(nav).toHaveAttribute("aria-valuemin", "1");
    expect(nav).toHaveAttribute("aria-valuemax", "5");
  });

  it("makes completed steps clickable as links", () => {
    renderWithIntl(<Stepper current={3} />);
    expect(screen.getByRole("link", { name: /Vehicle/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Extras/i })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Checkout/i })).not.toBeInTheDocument();
  });

  it("shows the mobile slim indicator", () => {
    renderWithIntl(<Stepper current={2} />);
    expect(screen.getByText(/Step 2 of 5/i)).toBeInTheDocument();
  });
});
