"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { fadeUp, inViewOnce } from "@/lib/motion/variants";
import { useMotionGate } from "@/lib/motion/useMotionGate";

/**
 * Reveal — drop-in `whileInView` wrapper that fades up its children once
 * (12px → identity, 320ms, ease-out). Honours `prefers-reduced-motion`
 * by collapsing the duration to 0.
 *
 * Most landing sections wrap their content in this; the parent stays a
 * server component, the wrapper is a thin client island.
 */
export interface RevealProps {
  as?: "section" | "div" | "article" | "header" | "footer";
  className?: string;
  /** Disable the in-view trigger (for elements above the fold). */
  alwaysVisible?: boolean;
  id?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
  children: React.ReactNode;
}

export function Reveal({
  as = "div",
  className,
  alwaysVisible = false,
  id,
  children,
  ...aria
}: RevealProps) {
  const reduce = useMotionGate();

  const Component =
    as === "section"
      ? motion.section
      : as === "article"
        ? motion.article
        : as === "header"
          ? motion.header
          : as === "footer"
            ? motion.footer
            : motion.div;

  return (
    <Component
      id={id}
      variants={fadeUp}
      initial={reduce || alwaysVisible ? false : "hidden"}
      whileInView={alwaysVisible ? undefined : "visible"}
      animate={alwaysVisible ? "visible" : undefined}
      viewport={inViewOnce}
      transition={reduce ? { duration: 0 } : undefined}
      className={className}
      {...aria}
    >
      {children}
    </Component>
  );
}
