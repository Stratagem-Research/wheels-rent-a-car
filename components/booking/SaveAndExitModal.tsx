"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalTitle,
  ModalTrigger,
} from "@/components/ui/Modal";
import { toast } from "@/components/ui/Toast";

/**
 * Save & exit modal per 04_booking_flow.md funnel-wide UX rules.
 *
 * Draft already lives in sessionStorage (`wheels.booking.draft`), so confirming
 * only navigates away and surfaces a toast. Resume-link email is deferred until
 * a backend `/api/booking/resume-link` endpoint exists — do not fake a send.
 */
export function SaveAndExitModal({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  const onSaveAndExit = () => {
    setSubmitting(true);
    try {
      toast.info("We saved your booking for 24 hours.");
      router.push("/vehicles");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal>
      <ModalTrigger asChild>{children}</ModalTrigger>
      <ModalContent size="sm">
        <ModalTitle>Save your booking?</ModalTitle>
        <ModalDescription>
          We&apos;ll keep your selections for 24 hours. Sign up to easily resume later.
        </ModalDescription>
        <ModalFooter>
          <Button variant="primary" onClick={onSaveAndExit} disabled={submitting} loading={submitting}>
            Save &amp; exit
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
