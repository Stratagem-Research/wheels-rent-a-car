import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal, ModalContent, ModalDescription, ModalTitle, ModalTrigger } from "./Modal";

describe("Modal", () => {
  function Demo({ defaultOpen = false } = {}) {
    return (
      <Modal defaultOpen={defaultOpen}>
        <ModalTrigger>Open</ModalTrigger>
        <ModalContent>
          <ModalTitle>Edit search</ModalTitle>
          <ModalDescription>Change pickup or return.</ModalDescription>
        </ModalContent>
      </Modal>
    );
  }

  it("opens on trigger click", async () => {
    render(<Demo />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await userEvent.click(screen.getByText("Open"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Edit search")).toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    render(<Demo defaultOpen />);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes on the close button", async () => {
    render(<Demo defaultOpen />);
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
