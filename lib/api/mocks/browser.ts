"use client";

import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

/**
 * Browser-side MSW worker. Only used when NEXT_PUBLIC_MOCK_API !== "false".
 * The worker script lives at /public/mockServiceWorker.js (created by
 * `pnpm msw init public/ --save`).
 */
export const worker = setupWorker(...handlers);
