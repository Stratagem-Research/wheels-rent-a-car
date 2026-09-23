# 14 — Authentication

> Routes: `/login`, `/register`, `/forgot-password`, `/reset-password`
> Depends on: `00_global.md`
> Related: PRD §5.5, §8.4
> Primary persona: Returning users; new users post-confirmation

---

## Purpose & success criteria

Auth pages are deliberately **simple, fast, and unintrusive**. Sign-in is offered but never blocking — guest checkout works for the entire booking flow.

**Success looks like:**
- ≥ 25% of confirmed bookings convert to an account (the 1-click create on confirmation page does most of the work).
- Sign-in completion < 10s for returning users.
- Forgot-password flow completion ≥ 70% of started flows.

---

## Layout — auth shell

All auth pages share a single-column centered layout.

```
┌── Slim header (logo only, centered or left) ───────────────────┐
└────────────────────────────────────────────────────────────────┘

                    ┌──────────────────────┐
                    │                      │
                    │   [Page form card]   │
                    │                      │
                    │   max-width 440px    │
                    │                      │
                    └──────────────────────┘

                    Optional secondary link (e.g. "Back to home")

┌── Minimal footer (legal links only) ───────────────────────────┐
└────────────────────────────────────────────────────────────────┘
```

- Background: `colors.surface-subtle` (light tint), 64px top padding.
- Form card: white, `rounded-xl`, 32px padding, `elevation-2`, max-width 440px.
- No primary nav, no WhatsApp FAB on auth pages (they create distraction).

---

## /login — Sign in

### Page sections

#### 1. Card heading

`headline-lg`: "Welcome back".

#### 2. Login form

```
Email *
[                         ]
Password *
[                         ]   👁
                       Forgot? →

[      Sign in      ]
```

- Email input with appropriate `autocomplete`.
- Password input with show/hide toggle (eye icon).
- "Forgot?" link → `/forgot-password`.
- `Sign in` `button-primary` blue, full width.

#### 3. OAuth (optional, Phase 1.5+)

Below the password form, divider with "or", then:
- `Continue with Google` (white outline + Google G icon)
- `Continue with Apple` (white outline + Apple icon)

Phase 1 ships email/password only; OAuth buttons appear in Phase 1.5.

#### 4. Switch link

Below the form, centered text: "New here? **Create an account →**" link.

---

## /register — Create account

### Page sections

#### 1. Card heading

`headline-lg`: "Create your account".
Subhead `body-sm`, neutral-50: "It takes 30 seconds. We'll save your details for next time."

#### 2. Register form

```
First name *      Last name *
[          ]      [          ]
Email *
[                                  ]
Password *                       👁
[                                  ]
Helper: 8+ characters, mix of letters and numbers.

Mobile (optional) (+961 ▾)
[                                  ]
Helper: We'll use this for WhatsApp updates.

☐ I agree to the Terms & Conditions and Privacy Policy *

[      Create account      ]
```

- Password strength indicator (small bar) appears under the password field as the user types.
- Mobile is optional but adds value (WhatsApp opt-in).
- T&C checkbox is required.
- Submit creates the account and signs in immediately.

#### 3. Switch link

"Already have an account? **Sign in →**".

#### 4. OAuth options

Same as login (Phase 1.5+).

---

## /forgot-password — Request reset

### Page sections

#### 1. Card heading

`headline-lg`: "Forgot your password?".
Subhead: "Enter your email — we'll send you a reset link."

#### 2. Form

```
Email *
[                         ]

[      Send reset link      ]
```

#### 3. Success state (replaces form on submit)

- Green check icon.
- "Check your inbox at name@domain.com — the link expires in 30 minutes."
- Tertiary link "Back to sign in →".

#### 4. Switch link

"Remembered? **Sign in →**".

---

## /reset-password?token=... — Set new password

Reached via the email reset link.

### Page sections

#### 1. Card heading

`headline-lg`: "Set a new password".

#### 2. Form

```
New password *                   👁
[                                  ]
Helper: 8+ characters, mix of letters and numbers.

Confirm new password *           👁
[                                  ]

[      Save password      ]
```

#### 3. Recovery-session states

The recovery link routes through `/api/auth/callback`, which establishes a
session before forwarding here. There is no `?token` query param.

- **Valid recovery session** (`useSession` ready with a session): show form.
- **No session / `?error=…` from the callback:** show error state with `Request a new link →` button.

#### 4. Success state

- Auto-sign in; redirect to `/account` with toast: "Password updated. ✓"

---

## Login modal (mid-checkout)

> **Status: ❌ Not implemented.** Checkout currently uses the guest flow only.
> The design below is retained as the spec for when it's built.

A modal version of the login form, used when an existing user hits checkout as a guest.

### Trigger

On `/book/checkout` step entry, if email entered matches a known account, surface a soft prompt: "We found your account — sign in to pre-fill your info?" with a `Sign in` button. Clicking opens the modal.

### Modal contents

- Same form as `/login`.
- "Continue as guest" `button-tertiary` link at the bottom dismisses the modal.

---

## Module-specific components

### `<AuthCard />`

Centered card pattern shared across all auth pages.

### `<LoginForm />`, `<RegisterForm />`, `<ForgotPasswordForm />`, `<ResetPasswordForm />`

Each is a standalone form with its own validation and submit handler.

### `<PasswordStrengthIndicator />`

Bar + label under the password field. 4 levels: Weak, Okay, Good, Strong.

### `<OAuthButton />`

> **Status: ❌ Not implemented.** No OAuth providers are configured in Supabase.

White outline button with provider icon (Google, Apple). Reused across login and register.

---

## States & edge cases

| Scenario                                           | Behavior                                                                                          | Status |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------ |
| Login: wrong password                              | Inline error: "Email or password incorrect." (generic to avoid enumeration).                      | ✅ Done |
| Login: 5 failed attempts                           | Lock account for 15 minutes; show clear message + reset link.                                     | ⚠️ Supabase-side rate limiting only; no app-level lockout |
| Register: email already in use                     | Supabase returns an error → inline form error.                                                    | ✅ Done |
| Register: email confirmation required              | Show "Confirm your email" state; do not sign the user in.                                          | ✅ Done |
| Forgot password: email not found                   | Show same success message regardless (no enumeration).                                            | ✅ Done |
| Reset password: link expired/used                  | Callback redirects with `?error`; page shows request-new-link CTA.                                 | ✅ Done |
| Auth page accessed while signed in                 | `proxy.ts` redirects `/login` + `/register` to `/account` (toast not implemented).                | ✅ Done (no toast) |
| Network failure mid-submit                         | Inline error; form state preserved.                                                               | ✅ Done |
| OAuth provider returns no email                    | Fallback profile-completion form.                                                                 | ❌ Not implemented (OAuth out of scope) |

---

## Data requirements

Auth is backed by **Supabase Auth** (`@supabase/ssr`). The session lives in
Supabase's `sb-*-auth-token` cookies; we additionally set a `wheels.session`
cookie carrying the user id so `proxy.ts` can gate `/account/*` without calling
Supabase on every request. Both must be present for a request to count as
authenticated.

- **Sign in:** `POST /api/auth/login` body `{ email, password }` → `{ user }`; sets `sb-*` + `wheels.session` cookies. 401 on bad credentials.
- **Register:** `POST /api/auth/register` body `{ firstName, lastName, email, password, mobile?, marketing }` → `{ user, requiresEmailConfirmation }`. When `requiresEmailConfirmation` is `true`, **no session is issued** — the client shows a "Confirm your email" state instead of redirecting.
- **Forgot password:** `POST /api/auth/forgot-password` body `{ email }` → always `200`. Sends a recovery link pointing at `/api/auth/callback?next=/reset-password`. Errors (incl. Supabase rate limits) are swallowed to prevent enumeration.
- **Auth callback:** `GET /api/auth/callback?code=…&next=…` exchanges the one-time code (PKCE) for a session, sets cookies, then redirects to `next` (only same-origin relative paths allowed). Used by password recovery and email confirmation. On failure redirects to `next?error=…`.
- **Reset password:** `POST /api/auth/reset-password` body `{ password }` → `{ user }`. Relies on the recovery session established by the callback (no `token` in the body). 400 if there is no valid recovery session.
- **Current user:** `GET /api/auth/me` → `{ user }` or 401. Used by `useSession` to hydrate.
- **Sign out:** `POST /api/auth/logout` → clears Supabase + `wheels.session` cookies.
- **OAuth:** _Not implemented_ (no providers configured). See "Implementation status" below.

---

## Security

- Password hashing, one-time reset codes, and email-confirmation are handled by **Supabase Auth**.
- Recovery uses the PKCE flow: the verifier cookie set during `forgot-password` is consumed by `/api/auth/callback`.
- `wheels.session` cookie is `httpOnly Secure(prod) SameSite=Lax`; Supabase auth cookies carry the real token.
- Generic errors on login (401, no enumeration) and forgot-password (always 200).
- **Rate-limiting:** handled by Supabase (login, signup, email send). No app-level per-IP lockout is implemented — a shared store (e.g. Upstash/Redis) would be required for reliable rate-limiting on serverless. Tracked as a follow-up.
- Auth pages are `noindex, nofollow` via the `(auth)` layout metadata.

---

## SEO & metadata

- **Login title:** "Sign In · Wheels Rent A Car"
- **Register title:** "Create Account · Wheels Rent A Car"
- All auth pages are `noindex, nofollow`.

---

## Acceptance criteria

- [x] All auth pages render with the centered card shell, no global header nav, no WhatsApp FAB.
- [x] Password show/hide toggle works on every password field.
- [x] Login: wrong password message appears correctly. (Rate-limit is Supabase-side.)
- [x] Register: T&C checkbox is required; password strength indicator updates as user types.
- [x] Forgot-password: success state shows after submission regardless of email validity.
- [x] Reset-password: invalid/expired links surface a clear error state.
- [ ] Login modal mid-checkout works without leaving the page. _(Not implemented — see below.)_
- [ ] Auth pages pass axe-core AA. _(Not re-verified after changes.)_
- [x] All forms support browser autofill (correct `autocomplete` attributes).

---

## Implementation status (as of go-live prep)

### Built and verified

- `/login`, `/register`, `/forgot-password`, `/reset-password` pages.
- API routes: `login`, `register`, `forgot-password`, `reset-password`, `logout`, `me`, and the new `callback`.
- Supabase-backed sessions with `wheels.session` mirror cookie + `proxy.ts` gating of `/account/*`.
- Signed-in users are redirected away from `/login` and `/register`.
- Password recovery end-to-end via `/api/auth/callback` (PKCE code exchange).
- Email-confirmation handling on register (no fake session).
- `noindex` on all auth pages.
- E2E smoke tests provision a confirmed Supabase user via the service-role key.

### Not implemented (deferred — require product/infra decisions)

- **OAuth** (`<OAuthButton />`, `/api/auth/oauth/[provider]`): needs Google/Apple provider credentials configured in Supabase. UI not wired.
- **Login modal mid-checkout**: not built; checkout currently uses guest flow only.
- **App-level rate-limiting / 5-attempt lockout**: relies on Supabase limits; a shared store is needed for per-IP enforcement on serverless.
- **"You're already signed in" toast**: redirect happens, but without the toast.

### Go-live action items (external config — cannot be done in code)

1. **Supabase → Auth → URL Configuration:** add the production origin and `https://<domain>/api/auth/callback` to the allowed redirect URLs. (`supabase/config.toml` currently only lists `https://127.0.0.1:3000` for local.)
2. **Set `WEBSITE_URL`** to the production domain (currently `http://localhost:3000` in `.env`; there is no `NEXT_PUBLIC_` variant — it is server-only). It drives every auth redirect/callback URL, canonical/OG URL, and payment callback/redirect URL.
3. **Configure SMTP** in Supabase (Auth → Emails) so confirmation and password-reset emails actually send. Without it, `enable_confirmations` will block sign-in.
4. **Decide on email confirmation:** if you want instant sign-in on register, disable confirmations in the hosted project (local `config.toml` already has `enable_confirmations = false`). Otherwise keep the confirm-email UX.
5. **Replace placeholder secrets** in `.env` (`WHISH_*`, `WHEELS_INTERNAL_API_TOKEN`) before enabling payments/booking sync — unrelated to auth but required for `getServerEnv()` consumers to boot.
