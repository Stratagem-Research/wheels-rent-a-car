"use client";

import * as React from "react";
import { Heart } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/Toast";
import { useSavedVehicles } from "@/hooks/useSavedVehicles";
import { useSession } from "@/hooks/useSession";

export interface SaveVehicleButtonProps {
  vehicleId: string;
  vehicleLabel: string;
  /** Dark vehicle cards use the inverse (paper-on-ink) treatment. */
  inverse?: boolean;
  className?: string;
}

export function SaveVehicleButton({
  vehicleId,
  vehicleLabel,
  inverse = true,
  className,
}: SaveVehicleButtonProps) {
  const t = useTranslations("fleet");
  const router = useRouter();
  const pathname = usePathname();
  const { session, ready: sessionReady } = useSession();
  const { isSaved, toggle, ready: savesReady } = useSavedVehicles();
  const [pending, setPending] = React.useState(false);

  const saved = savesReady && isSaved(vehicleId);
  const disabled = !sessionReady || pending || (Boolean(session) && !savesReady);

  const onClick = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (!session) {
      const redirect = pathname ? `?redirect=${encodeURIComponent(pathname)}` : "";
      router.push(`/login${redirect}`);
      return;
    }

    setPending(true);
    try {
      const nowSaved = await toggle(vehicleId);
      toast.success(nowSaved ? t("savedToast") : t("unsavedToast"));
    } catch {
      toast.error(t("saveError"));
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={saved}
      aria-label={saved ? t("unsaveVehicleAria", { vehicle: vehicleLabel }) : t("saveVehicleAria", { vehicle: vehicleLabel })}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2",
        inverse
          ? "text-paper bg-white/10 hover:bg-white/20 focus-visible:outline-paper"
          : "text-ink-80 bg-ink-10 hover:bg-ink-20 focus-visible:outline-ink-100",
        saved && (inverse ? "text-signal-red" : "text-signal-red"),
        className,
      )}
    >
      <Heart className={cn("size-4", saved && "fill-current")} aria-hidden="true" />
    </button>
  );
}
