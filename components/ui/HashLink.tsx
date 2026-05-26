"use client";

import * as React from "react";
import { replaceLocationHash, scrollToHashTarget } from "@/lib/navigation/hashAnchor";
import { cn } from "@/lib/utils";

export interface HashLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  targetId: string;
  scrollBlock?: ScrollLogicalPosition;
}

/**
 * Same-page anchor that updates the URL hash without a document fetch.
 */
export function HashLink({
  targetId,
  scrollBlock = "start",
  className,
  onClick,
  children,
  ...props
}: HashLinkProps) {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);
    if (event.defaultPrevented) return;
    event.preventDefault();
    replaceLocationHash(targetId);
    scrollToHashTarget(targetId, { block: scrollBlock });
  };

  return (
    <a href={`#${targetId}`} onClick={handleClick} className={cn(className)} {...props}>
      {children}
    </a>
  );
}
