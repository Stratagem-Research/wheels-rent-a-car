"use client";

import * as React from "react";
import {
  CreditCard,
  Wallet,
  Building2,
  Coins,
  ShieldCheck,
  Copy,
  Smartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { ErrorText, Field, HelperText, Label } from "@/components/ui/FormAtoms";
import { FileUpload } from "@/components/ui/FileUpload";
import { Input } from "@/components/ui/Input";
import { RadioGroup, RadioItem } from "@/components/ui/RadioGroup";
import { toast } from "@/components/ui/Toast";
import type { PaymentMethod } from "@/types/domain";

/*
 * Payment method selector per 04_booking_flow.md step 4.
 *
 * - Card        — Areeba-hosted iframe stub: a styled card form that does
 *                 NOT touch real card data. The "submit" handler returns
 *                 a mock paymentToken on success. PSP integration is out
 *                 of scope for this codebase (CLAUDE.md §10).
 * - Cash        — info copy only; no extra inputs.
 * - Bank        — info + required file upload (proof of transfer).
 * - OMT/Whish   — reference code display + optional receipt upload.
 *
 * The selector keeps its own value state via the parent (controlled) so
 * the parent can derive the CTA label and final submit payload.
 */

const OPTIONS: {
  value: PaymentMethod;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  tagline: string;
}[] = [
  {
    value: "whish-online",
    icon: Smartphone,
    label: "Whish online checkout",
    tagline: "Secure redirect to Whish payment page",
  },
  {
    value: "card",
    icon: CreditCard,
    label: "Credit / Debit card",
    tagline: "Visa · Mastercard · Amex",
  },
  { value: "cash", icon: Wallet, label: "Cash on pickup", tagline: "USD or LBP at the counter" },
  {
    value: "transfer",
    icon: Building2,
    label: "Bank transfer",
    tagline: "We hold the booking until verified",
  },
  { value: "omt", icon: Coins, label: "OMT / Whish / Bob", tagline: "Pay at any branch" },
];

export interface CardFormValue {
  number: string;
  expiry: string;
  cvv: string;
  holder: string;
}

export interface PaymentMethodSelectorProps {
  value: PaymentMethod | null;
  onValueChange: (next: PaymentMethod) => void;

  /** Card form fields (controlled). */
  card: CardFormValue;
  onCardChange: (next: CardFormValue) => void;
  cardError?: string;

  /** Bank transfer proof (required when "transfer" is selected). */
  transferProof: File | null;
  onTransferProofChange: (file: File | null) => void;

  /** OMT receipt (optional). */
  omtReceipt: File | null;
  onOmtReceiptChange: (file: File | null) => void;

  /** Booking reference if available, used in the bank/OMT instructions. */
  pendingRef?: string;
}

export function PaymentMethodSelector(props: PaymentMethodSelectorProps) {
  const { value, onValueChange } = props;

  return (
    <RadioGroup
      value={value ?? ""}
      onValueChange={(v) => onValueChange(v as PaymentMethod)}
      aria-label="Payment method"
      className="gap-3"
    >
      {OPTIONS.map((opt) => {
        const selected = value === opt.value;
        return (
          <div
            key={opt.value}
            className={cn(
              "bg-paper flex flex-col gap-3 rounded-xl border p-4 transition-colors",
              selected ? "border-ink-100 border-2" : "border-border",
            )}
          >
            <label className="flex cursor-pointer items-start gap-3">
              <RadioItem value={opt.value} className="mt-1" />
              <div className="flex flex-1 items-start gap-3">
                <opt.icon className="text-ink-100 mt-0.5 size-5" aria-hidden="true" />
                <div className="min-w-0 flex-1">
                  <div className="headline-xs text-ink-95">{opt.label}</div>
                  <div className="body-sm text-ink-60">{opt.tagline}</div>
                </div>
              </div>
            </label>
            {selected ? <MethodPanel method={opt.value} {...props} /> : null}
          </div>
        );
      })}
    </RadioGroup>
  );
}

function MethodPanel(props: PaymentMethodSelectorProps & { method: PaymentMethod }) {
  switch (props.method) {
    case "card":
      return <CardPanel {...props} />;
    case "whish-online":
      return <WhishOnlinePanel />;
    case "cash":
      return <CashPanel />;
    case "transfer":
      return <TransferPanel {...props} />;
    case "omt":
      return <OmtPanel {...props} />;
  }
}

function WhishOnlinePanel() {
  return (
    <Card variant="tint" className="p-4">
      <p className="body-sm text-ink-80">
        You&apos;ll be redirected to Whish to complete payment securely. We only confirm the booking
        after Whish status verification succeeds.
      </p>
    </Card>
  );
}

function CardPanel({ card, onCardChange, cardError }: PaymentMethodSelectorProps) {
  return (
    <Card variant="tint" className="flex flex-col gap-3 p-4">
      <div className="label-md text-ink-60 inline-flex items-center gap-1.5">
        <ShieldCheck className="size-3.5" aria-hidden="true" />
        Hosted by Areeba — we never store your card details.
      </div>
      <Field label="Card number" required>
        {({ id, describedBy, invalid }) => (
          <Input
            id={id}
            aria-describedby={describedBy}
            invalid={invalid}
            placeholder="4242 4242 4242 4242"
            autoComplete="cc-number"
            inputMode="numeric"
            value={card.number}
            onChange={(e) => onCardChange({ ...card, number: e.target.value })}
          />
        )}
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Expiry" required>
          {({ id }) => (
            <Input
              id={id}
              placeholder="MM/YY"
              autoComplete="cc-exp"
              inputMode="numeric"
              value={card.expiry}
              onChange={(e) => onCardChange({ ...card, expiry: e.target.value })}
            />
          )}
        </Field>
        <Field label="CVV" required>
          {({ id }) => (
            <Input
              id={id}
              placeholder="•••"
              autoComplete="cc-csc"
              inputMode="numeric"
              value={card.cvv}
              onChange={(e) => onCardChange({ ...card, cvv: e.target.value })}
            />
          )}
        </Field>
      </div>
      <Field label="Cardholder name" required>
        {({ id }) => (
          <Input
            id={id}
            placeholder="Full name as on card"
            autoComplete="cc-name"
            value={card.holder}
            onChange={(e) => onCardChange({ ...card, holder: e.target.value })}
          />
        )}
      </Field>
      {cardError ? <ErrorText>{cardError}</ErrorText> : null}
    </Card>
  );
}

function CashPanel() {
  return (
    <Card variant="tint" className="p-4">
      <p className="body-sm text-ink-80">
        Bring your payment in USD or LBP at pickup. A refundable security deposit is required at the
        counter. Booking confirms instantly; we&apos;ll WhatsApp to verify 24 hours before pickup.
      </p>
    </Card>
  );
}

function TransferPanel({
  transferProof,
  onTransferProofChange,
  pendingRef,
}: PaymentMethodSelectorProps) {
  const referenceLine = pendingRef ?? "(your booking ref appears here on submit)";
  return (
    <Card variant="tint" className="flex flex-col gap-3 p-4">
      <ul className="body-sm text-ink-80 flex flex-col gap-1">
        <li>· Bank: Bank of Beirut SAL</li>
        <li>· IBAN: LB00 0000 0000 0000 0000 0000 0000</li>
        <li className="inline-flex items-center gap-2">
          · Reference: <CopyableRef text={referenceLine}>{referenceLine}</CopyableRef>
        </li>
      </ul>
      <HelperText>
        Upload your proof of transfer. We&apos;ll confirm the booking within 24 hours. Accepted
        formats: PDF, JPG, PNG, up to 5 MB.
      </HelperText>
      <FileUpload
        label="Upload proof of transfer"
        accept=".pdf,.jpg,.jpeg,.png"
        maxSizeBytes={5 * 1024 * 1024}
        files={transferProof ? [transferProof] : []}
        onFilesChange={(files) => onTransferProofChange(files[0] ?? null)}
        onFileRemove={() => onTransferProofChange(null)}
      />
    </Card>
  );
}

function OmtPanel({ omtReceipt, onOmtReceiptChange, pendingRef }: PaymentMethodSelectorProps) {
  const referenceLine = pendingRef ?? "(your booking ref appears here on submit)";
  return (
    <Card variant="tint" className="flex flex-col gap-3 p-4">
      <ul className="body-sm text-ink-80 flex flex-col gap-1">
        <li>· Pay in cash at any OMT, Whish, or Bob Finance branch.</li>
        <li>· Code: ALWHEELS</li>
        <li className="inline-flex items-center gap-2">
          · Reference: <CopyableRef text={referenceLine}>{referenceLine}</CopyableRef>
        </li>
      </ul>
      <HelperText>
        Optional: upload the receipt to speed up verification (we typically confirm within 4 hours).
      </HelperText>
      <FileUpload
        label="Upload OMT receipt (optional)"
        accept=".pdf,.jpg,.jpeg,.png"
        maxSizeBytes={5 * 1024 * 1024}
        files={omtReceipt ? [omtReceipt] : []}
        onFilesChange={(files) => onOmtReceiptChange(files[0] ?? null)}
        onFileRemove={() => onOmtReceiptChange(null)}
      />
    </Card>
  );
}

function CopyableRef({ text, children }: { text: string; children: React.ReactNode }) {
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Couldn't copy — please copy manually.");
    }
  };
  return (
    <button
      type="button"
      onClick={onCopy}
      className="mono-md text-ink-95 hover:text-ink-100 focus-visible:outline-ink-100 inline-flex items-center gap-1.5 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      {children}
      <Copy className="size-3.5" aria-hidden="true" />
    </button>
  );
}

// Unused Label import — keep the symbol for downstream consumers that
// re-export Field along with Label.
void Label;
