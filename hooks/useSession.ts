"use client";

import { useSessionContext, type SessionStore, type SignUpResult } from "@/components/providers/SessionProvider";

export type { SessionStore, SignUpResult };
export type UseSessionReturn = SessionStore;

/** Shared session state — requires `SessionProvider` in the layout. */
export function useSession(): SessionStore {
  return useSessionContext();
}
