"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
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
 * - Confirms the user wants to leave; lets them email themselves a resume
 *   link (mocked here — Sprint 6 wires the email endpoint).
 * - Draft already lives in sessionStorage so no extra persistence needed.
 * - On confirm, routes to /vehicles and shows a toast confirming the
 *   24-hour hold.
 */
export function SaveAndExitModal({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const onSaveAndExit = async (sendLink: boolean) => {
    setSubmitting(true);
    try {
      if (sendLink && email) {
        // Sprint 6 will replace this with /api/booking/resume-link.
        await new Promise((r) => setTimeout(r, 250));
        toast.success(`We sent a resume link to ${email}.`);
      } else {
        toast.info("We saved your booking for 24 hours.");
      }
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
          We&apos;ll keep your selections for 24 hours. Sign up to easily resume later, or email
          yourself a resume link.
        </ModalDescription>
        <div className="mt-5 flex flex-col gap-2">
          <Input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            startAdornment={<Mail className="size-4" aria-hidden="true" />}
            autoComplete="email"
          />
        </div>
        <ModalFooter>
          <Button variant="tertiary" onClick={() => onSaveAndExit(false)} disabled={submitting}>
            Save without email
          </Button>
          <Button
            variant="primary"
            onClick={() => onSaveAndExit(true)}
            disabled={submitting || !email}
            loading={submitting}
          >
            Email me a resume link
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
