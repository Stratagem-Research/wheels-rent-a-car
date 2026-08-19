"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Button — INK & SIGNAL primitive (DESIGN.md §components.button).
 *
 * Variants:
 *   primary           Solid BLACK pill — default workhorse on light pages.
 *   primary-inverse   Solid WHITE pill — same role on dark surfaces.
 *   cta               Solid RED pill — the SINGLE highest-conversion action per
 *                     screen. Reserved for "Show cars", "Select", "Pay & confirm",
 *                     "Next". Never two in the same view.
 *   secondary         Outline pill on light — inverts on hover.
 *   secondary-inverse Outline pill on dark — inverts on hover.
 *   tertiary          Text-only pill (40px) on light. Replaces the old `ghost`.
 *   tertiary-inverse  Text-only pill (40px) on dark.
 *   icon              44px round icon button on light.
 *   whatsapp          Locked WhatsApp green — locked external brand.
 *
 * Sizes: sm 36px, md 48px (default), lg 56px, xl 64px (long-term hero only).
 * `cta` always renders at 56px regardless of the `size` prop.
 * `tertiary` and `tertiary-inverse` default to 40px (spec), upsize on request.
 * `icon` is 44px and ignores the size prop.
 */
const buttonVariants = cva(
  cn(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap select-none",
    "rounded-pill",
    "transition-colors duration-150 ease-out",
    "focus-visible:outline-2 focus-visible:outline-ink-100 focus-visible:outline-offset-2",
    "focus-visible:shadow-[0_0_0_4px_var(--color-ink-10)]",
    "disabled:cursor-not-allowed disabled:pointer-events-none",
    "[&_svg]:size-4 [&_svg]:shrink-0",
  ),
  {
    variants: {
      variant: {
        primary: cn(
          "bg-ink-100 text-paper",
          "hover:bg-ink-80 active:bg-ink-70",
          "disabled:bg-ink-15 disabled:text-ink-50",
        ),
        "primary-inverse": cn(
          "bg-paper text-ink-100",
          "hover:bg-ink-15 active:bg-ink-20",
          "focus-visible:outline-paper focus-visible:shadow-[0_0_0_4px_rgba(255,255,255,0.16)]",
          "disabled:bg-ink-80 disabled:text-ink-50",
        ),
        cta: cn(
          "bg-signal-red text-paper",
          "hover:bg-signal-red-hover active:bg-signal-red-press",
          "focus-visible:shadow-[0_0_0_4px_var(--color-signal-red-bg)]",
          "disabled:bg-ink-15 disabled:text-ink-50",
        ),
        secondary: cn(
          "bg-transparent text-ink-100 border-[1.5px] border-ink-100",
          "hover:bg-ink-100 hover:text-paper",
          "active:bg-ink-80 active:text-paper",
          "disabled:border-ink-30 disabled:text-ink-50",
        ),
        "secondary-inverse": cn(
          "bg-transparent text-paper border-[1.5px] border-paper",
          "hover:bg-paper hover:text-ink-100",
          "active:bg-ink-15 active:text-ink-100",
          "focus-visible:outline-paper focus-visible:shadow-[0_0_0_4px_rgba(255,255,255,0.16)]",
          "disabled:border-ink-70 disabled:text-ink-50",
        ),
        tertiary: cn(
          "bg-transparent text-ink-100",
          "hover:bg-ink-10 active:bg-ink-15",
          "disabled:bg-transparent disabled:text-ink-50",
        ),
        "tertiary-inverse": cn(
          "bg-transparent text-paper",
          "hover:bg-ink-90 active:bg-ink-80",
          "focus-visible:outline-paper focus-visible:shadow-[0_0_0_4px_rgba(255,255,255,0.16)]",
          "disabled:bg-transparent disabled:text-ink-50",
        ),
        icon: cn(
          "bg-transparent text-ink-100 size-11 p-0",
          "hover:bg-ink-10 active:bg-ink-15",
          "disabled:text-ink-50",
        ),
        whatsapp: cn(
          "bg-[#25D366] text-paper",
          "hover:bg-[#1eb256] active:bg-[#1eb256]",
          "disabled:bg-ink-15 disabled:text-ink-50",
        ),
      },
      size: {
        sm: "h-8 px-[18px] button-sm",
        md: "h-10 px-6 button-sm",
        lg: "h-12 px-8 button-md",
        xl: "h-14 px-10 button-lg",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    compoundVariants: [
      // `cta` always renders at 56px (button-lg typography) — singular CTA spec.
      { variant: "cta", size: "sm", class: "h-14 px-9 button-lg" },
      { variant: "cta", size: "md", class: "h-14 px-9 button-lg" },
      { variant: "cta", size: "xl", class: "h-16 px-11 button-lg" },
      // `tertiary` default height is 40px per DESIGN.md §components.button-tertiary.
      { variant: "tertiary", size: "md", class: "h-10 px-4 button-md" },
      { variant: "tertiary-inverse", size: "md", class: "h-10 px-4 button-md" },
      // `icon` ignores size — keep the 44px square set on the variant itself.
      { variant: "icon", size: "sm", class: "size-11 p-0" },
      { variant: "icon", size: "md", class: "size-11 p-0" },
      { variant: "icon", size: "lg", class: "size-11 p-0" },
      { variant: "icon", size: "xl", class: "size-11 p-0" },
    ],
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  /** Render the button's behavior on a child element (e.g. a Next.js Link). */
  asChild?: boolean;
  /** Show a spinner and disable interactions; preserves button width. */
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant,
    size,
    fullWidth,
    asChild = false,
    loading = false,
    disabled,
    children,
    type,
    ...props
  },
  ref,
) {
  const Comp = asChild ? Slot : "button";
  const isDisabled = disabled || loading;

  return (
    <Comp
      ref={ref}
      className={cn(buttonVariants({ variant, size, fullWidth }), className)}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      type={asChild ? undefined : (type ?? "button")}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" aria-hidden="true" />
          <span className="sr-only">Loading…</span>
          <span aria-hidden="true">{children}</span>
        </>
      ) : (
        children
      )}
    </Comp>
  );
});

export { buttonVariants };
