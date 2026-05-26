import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { FaqAccordion } from "./FaqAccordion";
import type { FaqEntry } from "@/types/domain";

const entries: FaqEntry[] = [
  { id: "f-b-1", group: "booking", question: "What do I need?", answer: "A valid licence." },
  {
    id: "f-b-2",
    group: "booking",
    question: "Is insurance included?",
    answer: "Basic cover is included.",
  },
];

describe("FaqAccordion", () => {
  beforeEach(() => {
    window.location.hash = "";
  });

  afterEach(() => {
    window.location.hash = "";
  });

  it("opens from a deep-linked hash without controlled-mode warnings", async () => {
    window.location.hash = "#f-b-2";
    render(<FaqAccordion entries={entries} />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Is insurance included?" })).toHaveAttribute(
        "data-state",
        "open",
      );
    });
  });

  it("updates the URL hash when an item is expanded", async () => {
    const user = userEvent.setup();
    render(<FaqAccordion entries={entries} />);

    await user.click(screen.getByRole("button", { name: "What do I need?" }));

    await waitFor(() => {
      expect(window.location.hash).toBe("#f-b-1");
    });
  });
});
