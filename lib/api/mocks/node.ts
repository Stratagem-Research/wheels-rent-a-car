import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/**
 * Server-side MSW interceptor for Next.js server components / route handlers.
 * Started lazily by `lib/api/mocks/server-start.ts`.
 */
export const server = setupServer(...handlers);
