# Launch Gate — Payment Report

Status: Partially complete (callback end-to-end in staging pending)
Owner: Website Team
Last updated: 2026-05-26

## Implemented controls

1. **Authoritative status verification**
   - Whish callback success route verifies payment status via `getPaymentStatus` before settlement:
     - `app/api/payments/whish/callback/success/route.ts`

2. **Hybrid method support**
   - Supported methods:
     - `cash`
     - `transfer`
     - `omt`
     - `whish-online`
   - Checkout integration:
     - `components/booking/PaymentMethodSelector.tsx`
     - `app/(booking)/book/checkout/page.tsx`
     - `types/domain.ts`

3. **Idempotency baseline**
   - `payment_events.external_id` unique in DB migration.
   - Upsert by `external_id` in payment event recorder:
     - `lib/server/payment-events.ts`

4. **Sync dispatch after confirmed payment**
   - Success callback dispatches Wizard sync:
     - `lib/server/wizard-sync.ts`
     - `app/api/payments/whish/callback/success/route.ts`

## Executed verification

- Unit/integration suite passes:
  - `pnpm test`
- Build and runtime compile pass:
  - `pnpm typecheck`
  - `pnpm build`

## Pending payment gate checks (staging)

- Callback replay test:
  - send duplicate success callback for same `external_id` and verify single terminal transition.
- Amount/currency mismatch test:
  - verify mismatch is rejected and logged.
- Full Whish sandbox end-to-end:
  - create payment -> redirect -> callback -> status verify -> sync dispatch.
- Manual method validation:
  - `cash`, `transfer`, `omt` pending/verification paths against DB records.

## Evidence references

- Whish client wrapper: `lib/payments/whish.ts`
- Payment event persistence: `lib/server/payment-events.ts`
- Whish API routes: `app/api/payments/whish/*`
- Checkout flow: `app/(booking)/book/checkout/page.tsx`
