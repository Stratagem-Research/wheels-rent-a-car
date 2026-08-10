# Wizard → website booking status webhook

Status: Implemented 2026-08-10 (Adam Aug 9 confirmation timing)  
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
| `status` | yes | `approved` or `confirmed` triggers confirmation email |
| `customer_email` | yes | Recipient |
| `vehicle` | no | Display string in email |

## Behaviour

1. Customer submit → website enqueues `booking_request_received`  
2. Wizard reviews → calls this webhook with `approved`/`confirmed`  
3. Website enqueues `booking_confirmation` **once** (idempotent on outbox template + ref)  
4. Other statuses return `{ confirmationEnqueued: false, reason: "status_not_approval" }`  

See [Adam_Response_Notifications_And_SMTP.md](./Adam_Response_Notifications_And_SMTP.md).
