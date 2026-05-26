"use client";

import { useReducedMotion } from "framer-motion";

/**
 * useMotionGate — re-export of framer-motion's `useReducedMotion()` for
 * Wheels components. Returns `true` when the user has `prefers-reduced-motion`
 * set; callers gate transitions on this so animations collapse to `0`.
 *
 * Example:
 *
 *   const reduce = useMotionGate();
 *   const duration = reduce ? 0 : 0.32;
 */
export function useMotionGate(): boolean {
  return Boolean(useReducedMotion());
}
