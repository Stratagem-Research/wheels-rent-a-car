"use client";

import * as React from "react";
import { clearSession, readSession, writeSession, type Session } from "@/lib/auth/session";
import { api } from "@/lib/api/client";
import { endpoints } from "@/lib/api/endpoints";
import type { User } from "@/types/domain";

/**
 * Client-side session hook.
 *
 * - SSR returns `{ session: null, ready: false }`.
 * - Hydrates from localStorage on first mount.
 * - `signIn(email, password)` posts to /api/auth/login (mocked).
 * - Listens to `wheels:session` + native `storage` events so multiple
 *   components on the same page (header avatar, account guard) stay in sync.
 */

export interface SignUpResult {
  session: Session | null;
  /** True when Supabase requires email confirmation before sign-in. */
  requiresEmailConfirmation: boolean;
}

export interface UseSessionReturn {
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

export function useSession(): UseSessionReturn {
  const [session, setSession] = React.useState<Session | null>(null);
  const [ready, setReady] = React.useState(false);

  // Hydrate from localStorage on first mount. SSR rendered the null session;
  // the effect synchronously bridges to the persisted value once we're on
  // the client.
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
      // If confirmation is required there is no real session yet — don't fake
      // one, or the proxy will bounce the user straight back to /login.
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
