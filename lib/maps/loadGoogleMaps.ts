/// <reference types="google.maps" />
"use client";

import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

/**
 * Loads the Google Maps Places library once, shared across every consumer.
 * `importLibrary()` is idempotent/cached internally by the loader, but we
 * still memoize our own promise so callers don't each call `setOptions`
 * (which the library requires happen before the first `importLibrary`).
 */
let placesLibraryPromise: Promise<google.maps.PlacesLibrary> | null = null;

export function loadGooglePlaces(): Promise<google.maps.PlacesLibrary> | null {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  if (!key) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        "[loadGoogleMaps] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set — falling back to plain " +
          "text address entry. If you just added it to .env, restart the dev server: Next.js " +
          "only reads .env on startup, not on hot-reload.",
      );
    }
    return null;
  }

  if (!placesLibraryPromise) {
    setOptions({ key, v: "weekly" });
    placesLibraryPromise = importLibrary("places");
  }
  return placesLibraryPromise;
}

/** Loads the Geocoding library — used to reverse-geocode the browser's
 *  geolocation coordinates into a human-readable address for "deliver to
 *  me". Shares the same memoized `setOptions` call as `loadGooglePlaces`. */
let geocodingLibraryPromise: Promise<google.maps.GeocodingLibrary> | null = null;

export function loadGoogleGeocoding(): Promise<google.maps.GeocodingLibrary> | null {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim();
  if (!key) return null;

  if (!geocodingLibraryPromise) {
    setOptions({ key, v: "weekly" });
    geocodingLibraryPromise = importLibrary("geocoding");
  }
  return geocodingLibraryPromise;
}
