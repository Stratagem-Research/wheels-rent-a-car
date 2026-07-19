"use client";

import * as React from "react";
import { clearSession, readSession, writeSession, type Session } from "@/lib/auth/session";
import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { User } from "@/types/domain";

/**
 * Shared session store — one `GET /api/auth/me` per page load, not one per
 * component. Every `useSession()` caller used to run its own hydration
 * effect; with ~30 `SaveVehicleButton`s on a fleet grid that meant ~30
 * redundant session checks. Mirrors `SavedVehiclesProvider`'s pattern.
 */

export interface SignUpResult {
  session: Session | null;
  requiresEmailConfirmation: boolean;
}

export interface SessionStore {
  session: Session | null;
  ready: boolean;
  signIn: (email: string, password: string) => Promise<Session>;
  signUp: (input: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    mobile?: string;
    marketing: boolean;
  }) => Promise<SignUpResult>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (password: string) => Promise<Session>;
  signOut: () => Promise<void>;
}

const SessionContext = React.createContext<SessionStore | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const store = useSessionStore();
  return <SessionContext.Provider value={store}>{children}</SessionContext.Provider>;
}

export function useSessionContext(): SessionStore {
  const store = React.useContext(SessionContext);
  if (!store) {
    throw new Error("useSession must be used within SessionProvider");
  }
  return store;
}

function useSessionStore(): SessionStore {
  const [session, setSession] = React.useState<Session | null>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    const sync = () => setSession(readSession());
    sync();
    void api
      .get<{ user: User }>(endpoints.authMe)
      .then((result) => {
        const next: Session = { user: result.user };
        writeSession(next);
        setSession(next);
      })
      .catch(() => {
        // /me clears httpOnly wheels.session on 401; also hit logout so any
        // leftover Supabase cookies don't keep proxy.ts redirecting /login → /account.
        void api.post(endpoints.authLogout, {}).catch(() => undefined);
        clearSession();
        setSession(null);
      })
      .finally(() => setReady(true));
    window.addEventListener("wheels:session", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("wheels:session", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const signIn = React.useCallback(async (email: string, password: string) => {
    const result = await api.post<{ user: User }>(endpoints.authLogin, { email, password });
    const next: Session = { user: result.user };
    writeSession(next);
    setSession(next);
    return next;
  }, []);

  const signUp = React.useCallback(
    async (input: {
      firstName: string;
      lastName: string;
      email: string;
      password: string;
      mobile?: string;
      marketing: boolean;
    }): Promise<SignUpResult> => {
      const result = await api.post<{ user: User; requiresEmailConfirmation?: boolean }>(
        endpoints.authRegister,
        input,
      );
      if (result.requiresEmailConfirmation) {
        return { session: null, requiresEmailConfirmation: true };
      }
      const next: Session = { user: result.user };
      writeSession(next);
      setSession(next);
      return { session: next, requiresEmailConfirmation: false };
    },
    [],
  );

  const forgotPassword = React.useCallback(async (email: string) => {
    await api.post(endpoints.authForgotPassword, { email });
  }, []);

  const resetPassword = React.useCallback(async (password: string) => {
    const result = await api.post<{ user: User }>(endpoints.authResetPassword, { password });
    const next: Session = { user: result.user };
    writeSession(next);
    setSession(next);
    return next;
  }, []);

  const signOut = React.useCallback(async () => {
    try {
      await api.post(endpoints.authLogout, {});
    } catch {
      // server may be unavailable; clear local cache regardless
    }
    clearSession();
    setSession(null);
  }, []);

  return { session, ready, signIn, signUp, forgotPassword, resetPassword, signOut };
}
