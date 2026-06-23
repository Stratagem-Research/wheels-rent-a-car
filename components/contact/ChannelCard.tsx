import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export interface ChannelCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  contact: string;
  hours: string;
  cta: { label: string; href: string; variant?: "primary" | "whatsapp" };
  /** Subtle WhatsApp-green border to mark it as the priority channel. */
  highlight?: boolean;
  /** Renders a "Closed" state instead of the CTA when out of hours. */
  closed?: boolean;
  closedMessage?: string;
  className?: string;
}

/**
 * 3-up channel card per 11_contact.md §2.
 * Phone card flips to a "Closed" state outside business hours; WhatsApp
 * stays available 24/7.
 */
export function ChannelCard({
  icon,
  title,
  description,
  contact,
  hours,
  cta,
  highlight,
  closed,
  closedMessage,
  className,
}: ChannelCardProps) {
  return (
    <Card
      variant="default"
      className={cn(
        "flex h-full flex-col gap-4 rounded-xl",
        highlight && "border-2 border-[#25D366]",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "inline-flex size-12 items-center justify-center rounded-lg",
          highlight ? "text-paper bg-[#25D366]" : "bg-ink-10 text-ink-100",
        )}
      >
        {icon}
      </span>
      <h3 className="headline-md text-ink-100">{title}</h3>
      <p className="body-sm text-ink-60">{description}</p>
      <div className="mt-2 flex flex-col">
        <span className="headline-xs text-ink-100">{contact}</span>
        <span className="label-md text-ink-50 mt-1">{hours}</span>
      </div>
      <div className="mt-auto pt-2">
        {closed ? (
          <p role="status" className="bg-warning-bg text-warning label-md rounded-pill px-4 py-2">
            {closedMessage ?? "Closed, message us on WhatsApp."}
          </p>
        ) : (
          <Button asChild variant={cta.variant ?? "primary"} size="md" fullWidth>
            <a
              href={cta.href}
              target={cta.href.startsWith("https://wa.me") ? "_blank" : undefined}
              rel={cta.href.startsWith("https://wa.me") ? "noopener noreferrer" : undefined}
            >
              {cta.label}
            </a>
          </Button>
        )}
      </div>
    </Card>
  );
}
