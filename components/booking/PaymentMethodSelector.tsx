"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Wallet, Building2, Coins, Smartphone, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Label } from "@/components/ui/FormAtoms";
import { RadioGroup, RadioItem } from "@/components/ui/RadioGroup";
import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { PaymentMethod, PaymentMethodPublicConfig, SiteConfig } from "@/types/domain";

const OPTION_META: {
  value: PaymentMethod;
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
  taglineKey: string;
}[] = [
    { value: "cash", icon: Wallet, labelKey: "cashLabel", taglineKey: "cashTagline" },
    { value: "transfer", icon: Building2, labelKey: "transferLabel", taglineKey: "transferTagline" },
    { value: "omt", icon: Coins, labelKey: "omtLabel", taglineKey: "omtTagline" },
    {
      value: "whish-online",
      icon: Smartphone,
      labelKey: "whishOnlineLabel",
      taglineKey: "whishOnlineTagline",
    },
    { value: "neo", icon: CreditCard, labelKey: "neoLabel", taglineKey: "neoTagline" },
  ];

export interface PaymentMethodSelectorProps {
  value: PaymentMethod | null;
  onValueChange: (next: PaymentMethod) => void;
}

function isSelectable(config: PaymentMethodPublicConfig): boolean {
  return config.enabled && config.available;
}

export function PaymentMethodSelector(props: PaymentMethodSelectorProps) {
  const t = useTranslations("checkoutPayment");
  const { value, onValueChange } = props;
  const [methods, setMethods] = React.useState<PaymentMethodPublicConfig[]>([]);

  React.useEffect(() => {
    let cancelled = false;
    void api
      .get<SiteConfig>(endpoints.siteConfig)
      .then((config) => {
        if (!cancelled) setMethods(config.paymentMethods ?? []);
      })
      .catch(() => {
        if (!cancelled) setMethods([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleOptions = OPTION_META.filter((opt) => {
    const config = methods.find((item) => item.method === opt.value);
    return config ? isSelectable(config) : false;
  });

  React.useEffect(() => {
    if (!value && visibleOptions.length > 0) {
      onValueChange(visibleOptions[0]!.value);
    }
  }, [onValueChange, value, visibleOptions]);

  if (visibleOptions.length === 0) {
    return (
      <Card variant="tint" className="p-4">
        <p className="body-sm text-ink-80">{t("noPaymentMethods")}</p>
      </Card>
    );
  }

  return (
    <RadioGroup
      value={value ?? ""}
      onValueChange={(v) => onValueChange(v as PaymentMethod)}
      aria-label={t("paymentMethodAria")}
      className="gap-3"
    >
      {visibleOptions.map((opt) => {
        const selected = value === opt.value;
        const config = methods.find((item) => item.method === opt.value);
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
              <OptionCopy opt={opt} config={config} t={t} />
            </label>
            {selected ? <MethodPanel method={opt.value} /> : null}
          </div>
        );
      })}
    </RadioGroup>
  );
}

function OptionCopy({
  opt,
  config,
  t,
}: {
  opt: (typeof OPTION_META)[number];
  config?: PaymentMethodPublicConfig;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <div className="flex flex-1 items-start gap-3">
      <opt.icon className="text-ink-100 mt-0.5 size-5" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="headline-xs text-ink-95">{t(opt.labelKey)}</div>
        <div className="body-sm text-ink-60">{t(opt.taglineKey)}</div>
        {config?.environment === "sandbox" ? (
          <div className="label-sm text-ink-60 mt-1">{t("sandboxBadge")}</div>
        ) : null}
      </div>
    </div>
  );
}

function MethodPanel({ method }: { method: PaymentMethod }) {
  switch (method) {
    case "card":
      return null;
    case "whish-online":
      return <WhishOnlinePanel />;
    case "neo":
      return <NeoPanel />;
    case "cash":
      return <CashPanel />;
    case "transfer":
      return <TransferPanel />;
    case "omt":
      return <OmtPanel />;
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

function NeoPanel() {
  const t = useTranslations("checkoutPayment");
  return (
    <Card variant="tint" className="p-4">
      <p className="body-sm text-ink-80">{t("neoBody")}</p>
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

function TransferPanel() {
  const t = useTranslations("checkoutPayment");
  return (
    <Card variant="tint" className="flex flex-col gap-3 p-4">
      <ul className="body-sm text-ink-80 flex flex-col gap-1">
        <li>· {t("transferBank")}</li>
        <li>· {t("transferIban")}</li>
      </ul>
    </Card>
  );
}

function OmtPanel() {
  const t = useTranslations("checkoutPayment");
  return (
    <Card variant="tint" className="p-4">
      <ul className="body-sm text-ink-80 flex flex-col gap-1">
        {/* <li>· {t("omtBranchLine")}</li> */}
        <li>· {t("omtCodeLine")}</li>
      </ul>
    </Card>
  );
}

void Label;
