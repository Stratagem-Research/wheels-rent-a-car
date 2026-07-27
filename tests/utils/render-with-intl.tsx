import type { ReactElement, ReactNode } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "@/messages/en.json";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { SavedVehiclesProvider } from "@/components/providers/SavedVehiclesProvider";

/**
 * Render helper for components using `useTranslations`/`useLocale` (next-intl).
 * Component tests run outside `app/layout.tsx`, so they need their own provider.
 */
export function renderWithIntl(ui: ReactElement, options?: RenderOptions) {
  return render(ui, {
    wrapper: ({ children }) => (
      <NextIntlClientProvider locale="en" messages={messages}>
        {children}
      </NextIntlClientProvider>
    ),
    ...options,
  });
}

/** Intl + session + saved-vehicles — for fleet cards and other account-aware UI. */
export function renderWithProviders(ui: ReactElement, options?: RenderOptions) {
  return render(ui, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <NextIntlClientProvider locale="en" messages={messages}>
        <SessionProvider>
          <SavedVehiclesProvider>{children}</SavedVehiclesProvider>
        </SessionProvider>
      </NextIntlClientProvider>
    ),
    ...options,
  });
}
