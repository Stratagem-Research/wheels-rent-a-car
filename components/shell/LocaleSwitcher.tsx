"use client";

import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import { Check, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { AppLocale } from "@/i18n/routing";

const LOCALES = [
  { id: "en", labelKey: "languageEnglish" },
  { id: "ar", labelKey: "languageArabic" },
  { id: "fr", labelKey: "languageFrench" },
] as const satisfies ReadonlyArray<{ id: AppLocale; labelKey: string }>;

export interface LocaleSwitcherProps {
  /** Header overlay/inverse — light icon treatment on dark backgrounds. */
  onDark?: boolean;
  /** Footer sits on a dark gradient; uses paper-toned trigger styling. */
  variant?: "header" | "footer";
  className?: string;
  /** Called after a locale is chosen (e.g. close a mobile drawer). */
  onLocaleChange?: () => void;
}

export function LocaleSwitcher({
  onDark = false,
  variant = "header",
  className,
  onLocaleChange,
}: LocaleSwitcherProps) {
  const tFooter = useTranslations("footer");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [, startTransition] = React.useTransition();

  const switchLocale = (nextLocale: AppLocale) => {
    if (nextLocale === locale) {
      setOpen(false);
      return;
    }
    setOpen(false);
    onLocaleChange?.();
    // Invalidate the Router Cache so RSC payloads, message catalogs, and
    // html lang/dir re-fetch with the updated NEXT_LOCALE cookie.
    startTransition(() => {
      router.replace(pathname || "/", { locale: nextLocale });
      router.refresh();
    });
  };

  const currentLabel =
    LOCALES.find((item) => item.id === locale)?.labelKey ?? "languageEnglish";

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={tFooter("switchLanguage")}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            "inline-flex size-9 items-center justify-center rounded-full transition-colors",
            "focus-visible:outline-2 focus-visible:outline-offset-2",
            variant === "footer"
              ? "text-paper/85 hover:bg-white/10 focus-visible:outline-paper"
              : onDark
                ? "text-paper hover:bg-white/10 focus-visible:outline-paper"
                : "text-ink-80 hover:bg-ink-10 focus-visible:outline-ink-100",
            className,
          )}
        >
          <Globe className="size-5" aria-hidden="true" />
          <span className="sr-only">{tFooter(currentLabel)}</span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="bg-surface border-border z-50 min-w-44 rounded-lg border p-1 shadow-[var(--shadow-elevation-2)]"
          role="listbox"
          aria-label={tFooter("switchLanguage")}
        >
          {LOCALES.map((item) => {
            const selected = locale === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => switchLocale(item.id)}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left",
                  "body-md transition-colors",
                  selected ? "bg-ink-10 text-ink-100" : "text-ink-95 hover:bg-ink-10",
                  "focus-visible:outline-ink-100 focus-visible:outline-2 focus-visible:outline-offset-2",
                )}
              >
                <span>{tFooter(item.labelKey)}</span>
                {selected ? <Check className="text-ink-60 size-4 shrink-0" aria-hidden="true" /> : null}
              </button>
            );
          })}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
