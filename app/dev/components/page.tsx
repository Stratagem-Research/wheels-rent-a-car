"use client";

import * as React from "react";
import { Heart, Search, Phone } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Button,
  Card,
  Checkbox,
  Chip,
  DatePopover,
  ErrorText,
  Field,
  FileUpload,
  HelperText,
  Input,
  Label,
  Modal,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalTitle,
  ModalTrigger,
  PhoneInput,
  QuantityStepper,
  RadioGroup,
  RadioItem,
  Select,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
  Skeleton,
  Slider,
  Spinner,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  TimePicker,
  Tooltip,
  toast,
  type PhoneValue,
} from "@/components/ui";

/**
 * /dev/components — internal QA route, NOT linked from the customer-facing site.
 * Renders every primitive in every meaningful state for visual review and
 * a11y audits (axe-core picks up issues across the entire page in one pass).
 */
export default function ComponentsShowcase() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-16 px-5 py-10 sm:px-10 sm:py-16">
      <Header />
      <ColorSwatches />
      <Typography />
      <Buttons />
      <Inputs />
      <Toggles />
      <Pickers />
      <DisplayPrimitives />
      <Overlays />
      <Navigation />
    </div>
  );
}

function Header() {
  return (
    <header className="flex flex-col gap-2">
      <p className="text-ink-100 overline">Internal</p>
      <h1 className="headline-lg text-ink-95">Component showcase</h1>
      <p className="body-md text-ink-60 max-w-2xl">
        Every Sprint 1 primitive in every meaningful state. Used for visual review and axe-core
        sweeps during development.
      </p>
    </header>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="headline-md text-ink-95">{title}</h2>
        {description ? <p className="body-sm text-ink-60">{description}</p> : null}
      </div>
      <div className="flex flex-col gap-6">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="border-border bg-surface flex flex-col gap-2 rounded-lg border p-5">
      <span className="label-md text-ink-50 tracking-wider uppercase">{label}</span>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}

function ColorSwatches() {
  const scales = [
    {
      name: "primary",
      shades: ["95", "90", "70", "50", "40", "30", "10"],
    },
    {
      name: "secondary",
      shades: ["95", "80", "60", "50", "40", "30"],
    },
    {
      name: "neutral",
      shades: ["99", "95", "90", "70", "50", "30", "10"],
    },
    {
      name: "tertiary",
      shades: ["95", "80", "50", "30"],
    },
  ] as const;

  return (
    <Section title="Colors" description="From /docs/Design/DESIGN.md.">
      <div className="flex flex-col gap-3">
        {scales.map(({ name, shades }) => (
          <div key={name} className="flex flex-wrap items-center gap-2">
            <span className="label-md text-ink-50 w-24 tracking-wider uppercase">{name}</span>
            {shades.map((shade) => (
              <div
                key={shade}
                className="flex flex-col items-center gap-1"
                style={{ minWidth: 64 }}
              >
                <div
                  className={`border-ink-20 size-12 rounded-md border bg-${name}-${shade}`}
                  title={`${name}-${shade}`}
                />
                <span className="label-sm text-ink-50">{shade}</span>
              </div>
            ))}
          </div>
        ))}
        <div className="flex flex-wrap gap-3">
          {[
            { token: "success", className: "bg-[var(--color-success)]" },
            { token: "warning", className: "bg-[var(--color-warning)]" },
            { token: "error", className: "bg-[var(--color-error)]" },
            { token: "info", className: "bg-[var(--color-info)]" },
            { token: "whatsapp", className: "bg-[var(--color-whatsapp)]" },
          ].map(({ token, className }) => (
            <div key={token} className="flex flex-col items-center gap-1" style={{ minWidth: 64 }}>
              <div
                className={`border-ink-20 size-12 rounded-md border ${className}`}
                title={token}
              />
              <span className="label-sm text-ink-50">{token}</span>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

function Typography() {
  return (
    <Section
      title="Typography"
      description="Geist Sans across the system; Geist Mono for tabular numerics. INK & SIGNAL."
    >
      <Card>
        <div className="flex flex-col gap-3">
          <span className="display-lg text-ink-95">Drive Lebanon, your way.</span>
          <span className="headline-lg text-ink-95">headline-lg — 44px / 800 uppercase</span>
          <span className="headline-lg text-ink-95">headline-lg — 32px / 800 uppercase</span>
          <span className="headline-md text-ink-95">headline-md — 24px / 800 uppercase</span>
          <span className="headline-sm text-ink-95">headline-sm — 18px / 800 uppercase</span>
          <span className="headline-xs text-ink-95">headline-xs — 14px / 800 uppercase</span>
          <span className="lead-lg text-ink-80">
            lead-lg — Premium cars from $25/day. Free Hazmieh pickup. 24/7 WhatsApp support.
          </span>
          <span className="body-md text-ink-80">
            body-md — Plans change. Cancel for free up to 24 hours before pickup. No questions, no
            fees.
          </span>
          <span className="body-sm text-ink-60">
            body-sm — Lebanon-based premium car rental, mobile-first and WhatsApp-native.
          </span>
          <span className="label-md text-ink-50">LABEL-MD · METADATA</span>
          <span className="text-ink-60 overline">Overline · uppercase only</span>
          <span className="mono-lg text-ink-95">WRC-260520-9KQ4</span>
          <span className="price-lg text-ink-95">$25 / day</span>
        </div>
      </Card>
    </Section>
  );
}

function Buttons() {
  const [loading, setLoading] = React.useState(false);
  return (
    <Section title="Buttons" description="One red CTA per screen — see docs/Design/DESIGN.md.">
      <Row label="On light">
        <Button variant="cta">Pay & confirm</Button>
        <Button variant="primary">Continue</Button>
        <Button variant="secondary">Edit search</Button>
        <Button variant="tertiary">View details</Button>
        <Button variant="icon" aria-label="Favorite">
          <Heart aria-hidden="true" />
        </Button>
        <Button variant="whatsapp">
          <Phone aria-hidden="true" /> WhatsApp
        </Button>
      </Row>
      <div className="bg-ink-100 -mx-5 px-5 py-5 sm:-mx-10 sm:px-10">
        <Row label="On dark">
          <Button variant="cta">Pay & confirm</Button>
          <Button variant="primary-inverse">Continue</Button>
          <Button variant="secondary-inverse">Edit search</Button>
          <Button variant="tertiary-inverse">View details</Button>
          <Button variant="whatsapp">
            <Phone aria-hidden="true" /> WhatsApp
          </Button>
        </Row>
      </div>
      <Row label="Sizes">
        <Button variant="primary" size="sm">
          Small (36px)
        </Button>
        <Button variant="primary" size="md">
          Default (48px)
        </Button>
        <Button variant="primary" size="lg">
          Large (56px)
        </Button>
        <Button variant="primary" size="xl">
          XL (64px)
        </Button>
      </Row>
      <Row label="States">
        <Button variant="primary" disabled>
          Disabled
        </Button>
        <Button variant="cta" disabled>
          CTA disabled
        </Button>
        <Button
          variant="primary"
          loading={loading}
          onClick={() => {
            setLoading(true);
            setTimeout(() => setLoading(false), 1500);
          }}
        >
          Click to load
        </Button>
        <Button variant="primary" fullWidth>
          Full width
        </Button>
      </Row>
    </Section>
  );
}

function Inputs() {
  const [phone, setPhone] = React.useState<PhoneValue>({ countryIso: "LB", national: "" });

  return (
    <Section title="Inputs & Form atoms">
      <Row label="Text input">
        <Field label="Email" required helper="We send confirmation to this address.">
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              aria-describedby={describedBy}
              invalid={invalid}
            />
          )}
        </Field>
        <Field
          label="Booking reference"
          error="We couldn't find that booking. Check the reference and email."
        >
          {({ id, describedBy, invalid }) => (
            <Input
              id={id}
              placeholder="WRC-XXXXXX-XXXX"
              aria-describedby={describedBy}
              invalid={invalid}
              startAdornment={<Search className="size-4" aria-hidden="true" />}
            />
          )}
        </Field>
        <Field label="Disabled field">
          {({ id }) => <Input id={id} value="readonly" disabled readOnly />}
        </Field>
      </Row>
      <Row label="Textarea & Select">
        <Field label="Anything else?" helper="Optional notes for the operations team.">
          {({ id, describedBy }) => (
            <Textarea id={id} aria-describedby={describedBy} placeholder="Type here…" />
          )}
        </Field>
        <Field label="Vehicle class" required>
          {({ id }) => (
            <Select id={id} defaultValue="">
              <option value="" disabled>
                Select a class
              </option>
              <option>Economy</option>
              <option>Compact</option>
              <option>Sedan</option>
              <option>SUV</option>
              <option>Luxury</option>
            </Select>
          )}
        </Field>
      </Row>
      <Row label="Phone input (defaults to LB +961)">
        <div className="w-full max-w-md">
          <Field label="Mobile number" required>
            {({ id, describedBy, invalid }) => (
              <PhoneInput
                id={id}
                aria-describedby={describedBy}
                invalid={invalid}
                value={phone}
                onValueChange={setPhone}
              />
            )}
          </Field>
        </div>
      </Row>
      <Row label="Standalone atoms">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dl-1" required>
            Label
          </Label>
          <Input id="dl-1" placeholder="Form atom demo" />
          <HelperText>Helper text — neutral, label-sm.</HelperText>
          <ErrorText>Error text — replaces helper when shown.</ErrorText>
        </div>
      </Row>
    </Section>
  );
}

function Toggles() {
  const [accept, setAccept] = React.useState(true);
  const [rateType, setRateType] = React.useState("best");
  const [whatsapp, setWhatsapp] = React.useState(true);
  const [qty, setQty] = React.useState(1);
  const [price, setPrice] = React.useState<number[]>([25, 120]);

  return (
    <Section title="Toggles, choices, quantity">
      <Row label="Checkbox">
        <Checkbox
          checked={accept}
          onCheckedChange={(c) => setAccept(c === true)}
          label="I agree to the Terms & Conditions and Privacy Policy"
        />
        <Checkbox disabled label="Disabled" />
      </Row>
      <Row label="Radio group">
        <RadioGroup value={rateType} onValueChange={setRateType}>
          <RadioItem value="best" label="Best Price — pay now, non-refundable" />
          <RadioItem value="flex" label="Flexible — free cancellation up to 24h" />
        </RadioGroup>
      </Row>
      <Row label="Switch">
        <Switch
          checked={whatsapp}
          onCheckedChange={setWhatsapp}
          label="Send booking updates via WhatsApp"
        />
      </Row>
      <Row label="Quantity stepper">
        <QuantityStepper
          aria-label="Baby seats"
          value={qty}
          onValueChange={setQty}
          min={0}
          max={4}
        />
        <span className="body-sm text-ink-60">$5 / day · max 4 per booking</span>
      </Row>
      <Row label="Slider (price range)">
        <div className="flex w-full max-w-md flex-col gap-2">
          <Slider
            value={price}
            onValueChange={setPrice}
            min={0}
            max={200}
            step={5}
            aria-label="Price per day"
          />
          <div className="body-sm text-ink-60 tabular-nums">
            ${price[0]} – ${price[1]} / day
          </div>
        </div>
      </Row>
    </Section>
  );
}

function Pickers() {
  const [date, setDate] = React.useState<Date | undefined>();
  const [time, setTime] = React.useState<string>("10:00");
  const [files, setFiles] = React.useState<File[]>([]);

  return (
    <Section title="Date, time, file upload">
      <Row label="Date popover">
        <div className="flex w-full max-w-md flex-wrap items-center gap-3">
          <DatePopover value={date} onValueChange={setDate} placeholder="Pickup date" />
          <TimePicker value={time} onValueChange={setTime} />
        </div>
      </Row>
      <Row label="File upload">
        <div className="w-full">
          <FileUpload
            label="Drag a file or browse"
            helper="PDF, JPG, or PNG · max 5 MB"
            accept=".pdf,.jpg,.jpeg,.png"
            maxSizeBytes={5 * 1024 * 1024}
            files={files}
            onFilesChange={setFiles}
            onFileRemove={(f) => setFiles((curr) => curr.filter((x) => x !== f))}
            multiple
          />
        </div>
      </Row>
    </Section>
  );
}

function DisplayPrimitives() {
  return (
    <Section title="Cards, badges, chips, loading">
      <Row label="Cards">
        <Card>Default card</Card>
        <Card variant="elevated">Elevated card</Card>
        <Card variant="inverse">Inverse card (deep blue)</Card>
        <Card variant="muted">Muted card</Card>
      </Row>
      <Row label="Badges">
        <Badge variant="bestDeal">Best deal</Badge>
        <Badge variant="popular">Popular</Badge>
        <Badge variant="new">New</Badge>
        <Badge variant="pending">Pending</Badge>
        <Badge variant="info">Info</Badge>
        <Badge variant="neutral">Neutral</Badge>
      </Row>
      <Row label="Chips (filter pills)">
        <Chip>All</Chip>
        <Chip variant="selected">Sedan</Chip>
        <Chip>SUV</Chip>
        <Chip>Auto only</Chip>
      </Row>
      <Row label="Skeletons & spinners">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-12 w-64 rounded-lg" />
        <Spinner size="sm" />
        <Spinner size="md" />
        <Spinner size="lg" />
      </Row>
    </Section>
  );
}

function Overlays() {
  return (
    <Section title="Modals, sheets, tooltips, toasts">
      <Row label="Modal">
        <Modal>
          <ModalTrigger asChild>
            <Button variant="primary">Open modal</Button>
          </ModalTrigger>
          <ModalContent size="md">
            <ModalTitle>Edit search</ModalTitle>
            <ModalDescription>
              Change pickup, return, or location. Prices recompute automatically.
            </ModalDescription>
            <ModalFooter>
              <Button variant="secondary">Cancel</Button>
              <Button variant="primary">Save changes</Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Row>
      <Row label="Sheet (mobile bottom)">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="secondary">Open bottom sheet</Button>
          </SheetTrigger>
          <SheetContent side="bottom">
            <SheetTitle>Booking summary</SheetTitle>
            <SheetDescription>Total updates live as you change selections.</SheetDescription>
            <div className="price-lg text-ink-95 mt-6">$245 total</div>
          </SheetContent>
        </Sheet>
      </Row>
      <Row label="Tooltip">
        <Tooltip content="We never store your card details.">
          <Button variant="tertiary">Hover or focus me</Button>
        </Tooltip>
      </Row>
      <Row label="Toasts">
        <Button variant="primary" onClick={() => toast.info("Search saved.")}>
          Info toast
        </Button>
        <Button variant="primary" onClick={() => toast.success("Your booking is confirmed.")}>
          Success
        </Button>
        <Button
          variant="primary"
          onClick={() => toast.warning("Prices changed slightly — review before paying.")}
        >
          Warning
        </Button>
        <Button
          variant="primary"
          onClick={() => toast.error("Online booking is temporarily unavailable.")}
        >
          Error
        </Button>
      </Row>
    </Section>
  );
}

function Navigation() {
  return (
    <Section title="Tabs, accordions">
      <Row label="Tabs">
        <Tabs defaultValue="included" className="w-full">
          <TabsList>
            <TabsTrigger value="included">What&apos;s included</TabsTrigger>
            <TabsTrigger value="mileage">Mileage</TabsTrigger>
            <TabsTrigger value="insurance">Insurance</TabsTrigger>
            <TabsTrigger value="driver">Driver requirements</TabsTrigger>
          </TabsList>
          <TabsContent value="included" className="body-md text-ink-80">
            Unlimited kilometres · Roadside assistance 24/7 · Basic insurance · Free Beirut Airport
            pickup.
          </TabsContent>
          <TabsContent value="mileage" className="body-md text-ink-80">
            Capped (200 km/day) or unlimited — choose at booking.
          </TabsContent>
          <TabsContent value="insurance" className="body-md text-ink-80">
            Basic, Smart, or All-inclusive. See /help/insurance-and-coverage.
          </TabsContent>
          <TabsContent value="driver" className="body-md text-ink-80">
            Minimum age 23. Valid licence held ≥ 1 year. Passport required.
          </TabsContent>
        </Tabs>
      </Row>
      <Row label="Accordion">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="q1">
            <AccordionTrigger>What do I need to rent a car?</AccordionTrigger>
            <AccordionContent>
              A valid driver&apos;s licence, a passport or national ID, and a credit card for the
              deposit. We&apos;ll verify at pickup.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="q2">
            <AccordionTrigger>Do you offer airport pickup?</AccordionTrigger>
            <AccordionContent>
              Yes — free at Beirut Airport (BEY). Meet our agent at arrivals, exit B.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="q3">
            <AccordionTrigger>Can I pay in cash?</AccordionTrigger>
            <AccordionContent>
              Yes. Cash on pickup is accepted in USD or LBP. A refundable deposit is required at the
              counter.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </Row>
    </Section>
  );
}
