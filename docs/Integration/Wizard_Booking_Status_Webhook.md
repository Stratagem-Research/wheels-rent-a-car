# Wizard → website booking status webhook

Status: Implemented 2026-08-10  
Endpoint: `POST /api/wizard/webhooks/booking-status`

## Auth

```
Authorization: Bearer <WHEELS_INTERNAL_API_TOKEN or WIZARD_API_TOKEN>
```

## Body

```json
{
  "booking_reference": "WRC-YYMMDD-XXXX",
  "status": "approved",
  "customer_email": "guest@example.com",
  "vehicle": "Toyota Raize"
}
```

| Field | Required | Notes |
| --- | --- | --- |
| `booking_reference` | yes | Website booking ref |
| `status` | yes | `approved`/`confirmed` → confirmation email. `cancelled`/`canceled`/`rejected` → drop inventory hold |
| `customer_email` | yes | Recipient |
| `vehicle` | no | Display string in email |

## Behaviour

1. Customer submit → website enqueues `booking_request_received` and creates a vehicle hold  
2. Wizard reviews → calls this webhook with `approved`/`confirmed`  
3. Website enqueues `booking_confirmation` **once** (idempotent on outbox template + ref)  
4. Wizard cancel/reject → calls this webhook with `cancelled` (or `canceled`/`rejected`)  
5. Website deletes `vehicle_booking_holds` for that ref so the car is bookable again (idempotent if already gone)  
6. Other statuses return `{ confirmationEnqueued: false, reason: "status_not_approval" }`  

Hold release is **not** inferred from polling. Wizard must POST cancel here.  

Hold release is **not** inferred from polling. Wizard must POST cancel here.

