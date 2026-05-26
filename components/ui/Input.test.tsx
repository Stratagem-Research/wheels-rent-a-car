import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Input } from "./Input";

describe("Input", () => {
  it("accepts typing", async () => {
    render(<Input placeholder="Email" />);
    const input = screen.getByPlaceholderText("Email");
    await userEvent.type(input, "hi@example.com");
    expect(input).toHaveValue("hi@example.com");
  });

  it("sets aria-invalid when invalid", () => {
    render(<Input placeholder="x" invalid />);
    expect(screen.getByPlaceholderText("x")).toHaveAttribute("aria-invalid", "true");
  });

  it("disables interaction when disabled", async () => {
    render(<Input placeholder="x" disabled />);
    const input = screen.getByPlaceholderText("x");
    await userEvent.type(input, "no");
    expect(input).toHaveValue("");
    expect(input).toBeDisabled();
  });
});
