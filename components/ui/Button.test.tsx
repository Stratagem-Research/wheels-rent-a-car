import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./Button";

describe("Button", () => {
  it("renders as a button with text", () => {
    render(<Button>Continue</Button>);
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
  });

  it("fires onClick", async () => {
    const handler = vi.fn();
    render(<Button onClick={handler}>Click me</Button>);
    await userEvent.click(screen.getByRole("button"));
    expect(handler).toHaveBeenCalledOnce();
  });

  it("does not fire onClick when disabled", async () => {
    const handler = vi.fn();
    render(
      <Button onClick={handler} disabled>
        Click me
      </Button>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(handler).not.toHaveBeenCalled();
  });

  it("renders loading state with aria-busy + spinner", () => {
    render(<Button loading>Saving</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toHaveAttribute("aria-busy", "true");
    expect(btn).toBeDisabled();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it("supports asChild for composition with other elements", () => {
    render(
      <Button asChild>
        <a href="https://example.com/cars">Browse cars</a>
      </Button>,
    );
    const link = screen.getByRole("link", { name: "Browse cars" });
    expect(link).toHaveAttribute("href", "https://example.com/cars");
  });
});
