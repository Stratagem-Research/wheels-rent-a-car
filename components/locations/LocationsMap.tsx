"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { Branch } from "@/types/domain";

/**
 * Lightweight branch map — Phase-1 mock that doesn't require a Mapbox or
 * Google Maps API key. Renders a stylised SVG of Lebanon with pins for each
 * branch; clicking a pin syncs with the branch list via `onSelect`.
 *
 * The geographic projection is a simple linear mapping inside the SVG
 * viewBox over the real lat/lng bounds of Wheels' branches plus a small
 * margin. Good enough for a "find your branch" affordance; production
 * swaps this for a real map with the same Branch[] data + onSelect API.
 */

// Bounding box covering Greater Beirut + airport (the area where we
// currently operate). Slightly padded for visual breathing room.
const BOUNDS = {
  minLat: 33.78,
  maxLat: 34.0,
  minLng: 35.45,
  maxLng: 35.7,
};
const VIEW_W = 800;
const VIEW_H = 600;

function project(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * VIEW_W;
  const y = ((BOUNDS.maxLat - lat) / (BOUNDS.maxLat - BOUNDS.minLat)) * VIEW_H;
  return { x, y };
}

export interface LocationsMapProps {
  branches: Branch[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}

export function LocationsMap({ branches, selectedId, onSelect, className }: LocationsMapProps) {
  return (
    <div
      className={cn(
        "border-border relative overflow-hidden rounded-lg border",
        "from-signal-blue-bg via-ink-10 to-signal-blue-bg bg-gradient-to-br",
        className,
      )}
    >
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Wheels branches across Greater Beirut"
        className="block h-full w-full"
      >
        {/* Stylised coastline + Beirut peninsula. */}
        <defs>
          <radialGradient id="sea" cx="20%" cy="40%" r="80%">
            <stop offset="0%" stopColor="#A5C3E8" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#1A60A8" stopOpacity="0.2" />
          </radialGradient>
          <linearGradient id="land" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#F8F4EC" />
            <stop offset="100%" stopColor="#D9CFB6" />
          </linearGradient>
        </defs>

        {/* Sea (left half). */}
        <rect x="0" y="0" width={VIEW_W * 0.4} height={VIEW_H} fill="url(#sea)" />

        {/* Land mass — abstract coastline curve. */}
        <path
          d={`M ${VIEW_W * 0.42} 0
              C ${VIEW_W * 0.36} ${VIEW_H * 0.18}, ${VIEW_W * 0.34} ${VIEW_H * 0.32}, ${VIEW_W * 0.42} ${VIEW_H * 0.45}
              C ${VIEW_W * 0.5} ${VIEW_H * 0.58}, ${VIEW_W * 0.46} ${VIEW_H * 0.72}, ${VIEW_W * 0.52} ${VIEW_H}
              L ${VIEW_W} ${VIEW_H}
              L ${VIEW_W} 0 Z`}
          fill="url(#land)"
        />

        {/* Subtle road hints. */}
        <g stroke="#C9D1DB" strokeWidth="2" strokeDasharray="6 8" fill="none" opacity="0.8">
          <path d={`M ${VIEW_W * 0.5} 0 L ${VIEW_W * 0.6} ${VIEW_H}`} />
          <path d={`M ${VIEW_W * 0.42} ${VIEW_H * 0.4} L ${VIEW_W} ${VIEW_H * 0.45}`} />
        </g>

        {/* Branch pins. */}
        {branches.map((b) => {
          const { x, y } = project(b.lat, b.lng);
          const active = b.id === selectedId;
          return (
            <g
              key={b.id}
              transform={`translate(${x}, ${y})`}
              className="cursor-pointer"
              onClick={() => onSelect(b.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(b.id);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`Highlight ${b.name}`}
              aria-pressed={active}
            >
              <circle r={active ? 26 : 18} fill="#0E4F94" opacity={active ? 0.18 : 0.1} />
              <circle
                r={active ? 14 : 10}
                fill={b.isAirport ? "#C8102E" : "#0E4F94"}
                stroke="#FFFFFF"
                strokeWidth="2.5"
              />
              <text
                x={0}
                y={active ? -22 : -16}
                textAnchor="middle"
                className="label-md"
                fill="#0B0E13"
                fontWeight={600}
              >
                {b.isAirport ? "✈" : ""} {b.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Static-map fallback label for screen readers + a11y. */}
      <p className="sr-only">
        Wheels operates {branches.length} branches across Greater Beirut:{" "}
        {branches.map((b) => b.name).join(", ")}.
      </p>
    </div>
  );
}
