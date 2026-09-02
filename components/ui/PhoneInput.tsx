"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Phone input — country code + national-number field.
 * Sprint 1 ships a focused, Lebanon-first list of dial codes
 * (the inbound tourism markets + Lebanese expat hubs). A full searchable
 * picker arrives with the search bar in Sprint 3.
 *
 * Defaults to LB / +961 per 00_global.md §17.
 */

export type CountryCode = {
  iso: string; // ISO-3166 alpha-2
  flag: string; // emoji
  dial: string; // e.g. "961"
  name: string;
};

export const COUNTRY_CODES: CountryCode[] = [
  { iso: "LB", flag: "🇱🇧", dial: "961", name: "Lebanon" },
  { iso: "US", flag: "🇺🇸", dial: "1", name: "United States" },
  { iso: "CA", flag: "🇨🇦", dial: "1", name: "Canada" },
  { iso: "GB", flag: "🇬🇧", dial: "44", name: "United Kingdom" },
  { iso: "FR", flag: "🇫🇷", dial: "33", name: "France" },
  { iso: "DE", flag: "🇩🇪", dial: "49", name: "Germany" },
  { iso: "IT", flag: "🇮🇹", dial: "39", name: "Italy" },
  { iso: "ES", flag: "🇪🇸", dial: "34", name: "Spain" },
  { iso: "NL", flag: "🇳🇱", dial: "31", name: "Netherlands" },
  { iso: "BE", flag: "🇧🇪", dial: "32", name: "Belgium" },
  { iso: "CH", flag: "🇨🇭", dial: "41", name: "Switzerland" },
  { iso: "SE", flag: "🇸🇪", dial: "46", name: "Sweden" },
  { iso: "AU", flag: "🇦🇺", dial: "61", name: "Australia" },
  { iso: "BR", flag: "🇧🇷", dial: "55", name: "Brazil" },
  { iso: "AE", flag: "🇦🇪", dial: "971", name: "United Arab Emirates" },
  { iso: "SA", flag: "🇸🇦", dial: "966", name: "Saudi Arabia" },
  { iso: "QA", flag: "🇶🇦", dial: "974", name: "Qatar" },
  { iso: "KW", flag: "🇰🇼", dial: "965", name: "Kuwait" },
  { iso: "JO", flag: "🇯🇴", dial: "962", name: "Jordan" },
  { iso: "EG", flag: "🇪🇬", dial: "20", name: "Egypt" },
  { iso: "TR", flag: "🇹🇷", dial: "90", name: "Turkey" },
];

export interface PhoneValue {
  countryIso: string;
  national: string;
}

export interface PhoneInputProps {
  value: PhoneValue;
  onValueChange: (next: PhoneValue) => void;
  invalid?: boolean;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
  className?: string;
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(function PhoneInput(
  { value, onValueChange, invalid, disabled, placeholder = "70 123 456", id, className, ...aria },
  ref,
) {
  const LEBANON = COUNTRY_CODES[0]!; // LB is the first entry by construction.
  const country = COUNTRY_CODES.find((c) => c.iso === value.countryIso) ?? LEBANON;

  return (
    <div
      className={cn(
        "bg-surface flex h-10 w-full items-center rounded-md",
        "border transition-colors duration-150 ease-out",
        "focus-within:outline-ink-100 focus-within:outline-2 focus-within:outline-offset-0",
        "focus-within:shadow-[0_0_0_4px_var(--color-signal-blue-bg)]",
        invalid
          ? "border-error border-[1.5px]"
          : "border-border focus-within:border-ink-100 border",
        disabled && "bg-ink-10 cursor-not-allowed",
        className,
      )}
    >
      <div className="border-border relative flex h-full items-center border-r pr-2 pl-4">
        <span className="mr-1.5 text-base" aria-hidden="true">
          {country.flag}
        </span>
        <span className="body-md text-ink-95 whitespace-nowrap tabular-nums">+{country.dial}</span>
        <ChevronDown
          aria-hidden="true"
          className="text-ink-60 pointer-events-none ml-1.5 size-3.5"
        />
        <select
          disabled={disabled}
          value={country.iso}
          onChange={(e) => onValueChange({ ...value, countryIso: e.target.value })}
          className="absolute inset-0 cursor-pointer opacity-0 disabled:cursor-not-allowed"
          aria-label="Country code"
        >
          {COUNTRY_CODES.map((c) => (
            <option key={c.iso} value={c.iso}>
              {c.name} (+{c.dial})
            </option>
          ))}
        </select>
      </div>
      <input
        ref={ref}
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        placeholder={placeholder}
        disabled={disabled}
        value={value.national}
        onChange={(e) => onValueChange({ ...value, national: e.target.value })}
        aria-invalid={invalid || aria["aria-invalid"]}
        aria-describedby={aria["aria-describedby"]}
        className={cn(
          "body-md text-ink-95 flex-1 bg-transparent px-4 outline-none",
          "placeholder:text-ink-50 tabular-nums",
          "disabled:text-ink-50 disabled:cursor-not-allowed",
        )}
      />
    </div>
  );
});
