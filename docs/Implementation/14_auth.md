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

#### 3. Token states

- **Valid token:** show form.
- **Expired or invalid token:** show error state with `Request a new link →` button.

#### 4. Success state

- Auto-sign in; redirect to `/account` with toast: "Password updated. ✓"

---

## Login modal (mid-checkout)

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

White outline button with provider icon (Google, Apple). Reused across login and register.

---

## States & edge cases

| Scenario                                           | Behavior                                                                                          |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Login: wrong password                              | Inline error: "Email or password incorrect." (generic to avoid enumeration).                      |
| Login: 5 failed attempts                           | Lock account for 15 minutes; show clear message + reset link.                                     |
| Register: email already in use                     | Inline error: "An account exists for this email — sign in or reset password."                     |
| Forgot password: email not found                   | Show same success message regardless (no enumeration).                                            |
| Reset password: token expired                      | Show error state with request-new-link CTA.                                                       |
| Auth page accessed while signed in                 | Redirect to `/account` with toast: "You're already signed in."                                    |
| Network failure mid-submit                         | Inline retry banner; preserve form state.                                                         |
| OAuth provider returns no email                    | Show fallback: "Please complete your profile." → mini form for missing fields.                    |

---

## Data requirements

- **Sign in:** `POST /api/auth/login` body `{ email, password }` → session token.
- **Register:** `POST /api/auth/register` body `{ firstName, lastName, email, password, mobile?, marketing }` → session.
- **Forgot password:** `POST /api/auth/forgot-password` body `{ email }` → 200 (always).
- **Reset password:** `POST /api/auth/reset-password` body `{ token, password }` → session on success.
- **OAuth:** `GET /api/auth/oauth/[provider]` initiates OAuth flow.

---

## Security

- Passwords hashed with bcrypt or argon2 server-side.
- Reset tokens one-time use, expire in 30 minutes.
- Session token stored in `httpOnly Secure SameSite=Lax` cookie.
- CSRF protection on all state-changing endpoints.
- Rate-limit login (5 per IP per 15 min) and forgot-password (3 per IP per hour).
- Generic errors on login and forgot-password to prevent email enumeration.

---

## SEO & metadata

- **Login title:** "Sign In · Wheels Rent A Car"
- **Register title:** "Create Account · Wheels Rent A Car"
- All auth pages are `noindex, nofollow`.

---

## Acceptance criteria

- [ ] All auth pages render with the centered card shell, no global header nav, no WhatsApp FAB.
- [ ] Password show/hide toggle works on every password field.
- [ ] Login: wrong password and rate-limit messages appear correctly.
- [ ] Register: T&C checkbox is required; password strength indicator updates as user types.
- [ ] Forgot-password: success state shows after submission regardless of email validity.
- [ ] Reset-password: invalid/expired tokens surface a clear error state.
- [ ] Login modal mid-checkout works without leaving the page.
- [ ] Auth pages pass axe-core AA.
- [ ] All forms support browser autofill (correct `autocomplete` attributes).
