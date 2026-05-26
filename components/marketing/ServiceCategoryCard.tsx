"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export interface ServiceCategoryCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  fromPrice: string;
  onRequest: () => void;
  className?: string;
}

/**
 * 3-up service category card per 07_chauffeur.md.
 */
export function ServiceCategoryCard({
  icon,
  title,
  description,
  fromPrice,
  onRequest,
  className,
}: ServiceCategoryCardProps) {
  return (
    <Card variant="elevated" className={cn("flex flex-col gap-3", className)}>
      <span
        aria-hidden="true"
        className="bg-signal-blue-bg text-ink-100 inline-flex size-12 items-center justify-center rounded-md"
      >
        {icon}
      </span>
      <h3 className="headline-md text-ink-95">{title}</h3>
      <p className="body-sm text-ink-60 flex-1">{description}</p>
      <span className="price-md text-ink-95">{fromPrice}</span>
      <Button variant="primary" size="sm" onClick={onRequest} className="self-start">
        Request
      </Button>
    </Card>
  );
}
