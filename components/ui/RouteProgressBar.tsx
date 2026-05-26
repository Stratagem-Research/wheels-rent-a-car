"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Route progress bar per 00_global.md §3:
 * "2px progress bar in ink-100 at the top edge for any route change > 300ms."
 *
 * We start the bar on path/search change and let it ride to ~90% with an
 * ease curve, then finish to 100% when the new route mounts (this effect re-fires).
 */
export function RouteProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = React.useState(0);
  const [visible, setVisible] = React.useState(false);
  const finishTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickTimer = React.useRef<ReturnType<typeof setInterval> | null>(null);
  const isFirstRender = React.useRef(true);

  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setVisible(true);
    setProgress(8);
    if (tickTimer.current) clearInterval(tickTimer.current);
    tickTimer.current = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return p;
        return p + (90 - p) * 0.1;
      });
    }, 120);

    if (finishTimer.current) clearTimeout(finishTimer.current);
    finishTimer.current = setTimeout(() => {
      if (tickTimer.current) clearInterval(tickTimer.current);
      setProgress(100);
      setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 200);
    }, 600);

    return () => {
      if (tickTimer.current) clearInterval(tickTimer.current);
      if (finishTimer.current) clearTimeout(finishTimer.current);
    };
  }, [pathname, searchParams]);

  return (
    <div
      role="progressbar"
      aria-hidden={!visible}
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "bg-ink-100 pointer-events-none fixed top-0 left-0 z-[60] h-0.5 transition-all duration-200 ease-out",
        visible ? "opacity-100" : "opacity-0",
      )}
      style={{ width: `${progress}%` }}
    />
  );
}
