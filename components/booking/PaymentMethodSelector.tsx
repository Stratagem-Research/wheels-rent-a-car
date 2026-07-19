"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Wallet, Building2, Coins, Copy, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Label } from "@/components/ui/FormAtoms";
import { RadioGroup, RadioItem } from "@/components/ui/RadioGroup";
import { toast } from "@/components/ui/Toast";
import type { PaymentMethod } from "@/types/domain";

/*
 * Payment method selector per 04_booking_flow.md step 4.
 *
 * - Card        — hidden until an Areeba-hosted/tokenized form is integrated.
 * - Cash        — info copy only; no extra inputs.
 * - Bank        — transfer instructions; verification happens operationally.
 * - OMT/Whish   — reference code display.
 *
 * The selector keeps its own value state via the parent (controlled) so
 * the parent can derive the CTA label and final submit payload.
 */

const OPTIONS: {
  value: PaymentMethod;
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
  taglineKey: string;
}[] = [
  {
    value: "whish-online",
    icon: Smartphone,
    labelKey: "whishOnlineLabel",
    taglineKey: "whishOnlineTagline",
  },
  {
    value: "cash",
    icon: Wallet,
    labelKey: "cashLabel",
    taglineKey: "cashTagline",
  },
  {
    value: "transfer",
    icon: Building2,
    labelKey: "transferLabel",
    taglineKey: "transferTagline",
  },
  {
    value: "omt",
    icon: Coins,
    labelKey: "omtLabel",
    taglineKey: "omtTagline",
  },
];

export interface PaymentMethodSelectorProps {
  value: PaymentMethod | null;
  onValueChange: (next: PaymentMethod) => void;

  /** Booking reference if available, used in the bank/OMT instructions. */
  pendingRef?: string;
}

export function PaymentMethodSelector(props: PaymentMethodSelectorProps) {
  const t = useTranslations("checkoutPayment");
  const { value, onValueChange } = props;

  return (
    <RadioGroup
      value={value ?? ""}
      onValueChange={(v) => onValueChange(v as PaymentMethod)}
      aria-label={t("paymentMethodAria")}
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
                  <div className="headline-xs text-ink-95">{t(opt.labelKey)}</div>
                  <div className="body-sm text-ink-60">{t(opt.taglineKey)}</div>
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
      return null;
    case "whish-online":
      return <WhishOnlinePanel />;
    case "cash":
      return <CashPanel />;
    case "transfer":
      return <TransferPanel pendingRef={props.pendingRef} />;
    case "omt":
      return <OmtPanel pendingRef={props.pendingRef} />;
  }
}

function WhishOnlinePanel() {
  const t = useTranslations("checkoutPayment");
  return (
    <Card variant="tint" className="p-4">
      <p className="body-sm text-ink-80">{t("whishOnlineBody")}</p>
    </Card>
  );
}

function CashPanel() {
  const t = useTranslations("checkoutPayment");
  return (
    <Card variant="tint" className="p-4">
      <p className="body-sm text-ink-80">{t("cashBody")}</p>
    </Card>
  );
}

function TransferPanel({ pendingRef }: Pick<PaymentMethodSelectorProps, "pendingRef">) {
  const t = useTranslations("checkoutPayment");
  const referenceLine = pendingRef ?? t("pendingReferenceFallback");
  return (
    <Card variant="tint" className="flex flex-col gap-3 p-4">
      <ul className="body-sm text-ink-80 flex flex-col gap-1">
        <li>· {t("transferBank")}</li>
        <li>· {t("transferIban")}</li>
        <li className="inline-flex items-center gap-2">
          · {t("transferReference")}:{" "}
          <CopyableRef text={referenceLine}>{referenceLine}</CopyableRef>
        </li>
      </ul>
    </Card>
  );
}

function OmtPanel({ pendingRef }: Pick<PaymentMethodSelectorProps, "pendingRef">) {
  const t = useTranslations("checkoutPayment");
  const referenceLine = pendingRef ?? t("pendingReferenceFallback");
  return (
    <Card variant="tint" className="flex flex-col gap-3 p-4">
      <ul className="body-sm text-ink-80 flex flex-col gap-1">
        <li>· {t("omtBranchLine")}</li>
        <li>· {t("omtCodeLine")}</li>
        <li className="inline-flex items-center gap-2">
          · {t("transferReference")}:{" "}
          <CopyableRef text={referenceLine}>{referenceLine}</CopyableRef>
        </li>
      </ul>
    </Card>
  );
}

function CopyableRef({ text, children }: { text: string; children: React.ReactNode }) {
  const t = useTranslations("checkoutPayment");
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t("copied"));
    } catch {
      toast.error(t("copyError"));
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
