"use client";

import type { Variants, Transition } from "framer-motion";

/**
 * Wheels motion variants — INK & SIGNAL motion layer (Phase 11).
 *
 * The system has three motion personas:
 *   - section reveal      gentle fadeUp on scroll-in (once)
 *   - results / featured  stagger (60ms between siblings)
 *   - popover / sheet     softened scale + slight Y lift
 *
 * Every variant honours `prefers-reduced-motion` automatically when the
 * consuming component pipes the `useMotionGate()` `duration` through.
 *
 * Tokens:
 *   - durations measured in seconds (framer's native unit)
 *   - 320ms section reveal, 180ms popover open, 200ms route fade
 *   - default easing `[0.22, 1, 0.36, 1]` (smooth ease-out cubic)
 */

const easeOut: Transition["ease"] = [0.22, 1, 0.36, 1];

/** Section scroll-in — fades up 12px → identity. */
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: easeOut },
  },
};

/** Stagger container — children animate 60ms apart. */
export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.02,
    },
  },
};

/** Stagger child — paired with `staggerContainer`. */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.32, ease: easeOut },
  },
};

/** Popover / dropdown — soft scale + 4px slide. 180ms. */
export const popoverOpen: Variants = {
  hidden: { opacity: 0, scale: 0.96, y: -4 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.18, ease: easeOut },
  },
};

/** Route transition — 200ms fade + 8px lift. */
export const routeFade: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2, ease: easeOut },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: { duration: 0.15, ease: easeOut },
  },
};

/** Card expand — used with framer's `layout` prop on VehicleCardExpanded. */
export const cardExpand: Transition = {
  type: "spring",
  stiffness: 320,
  damping: 30,
};

/** Default viewport config for `whileInView` — fire once when 20% visible. */
export const inViewOnce = {
  once: true,
  amount: 0.2,
} as const;
