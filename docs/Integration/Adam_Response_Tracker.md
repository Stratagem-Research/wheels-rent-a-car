# Adam / Wheels Response Tracker

Status: Open  
Owner: Marc  
Last updated: 2026-08-10

**Master go-live order:** [Production_Go_Live_Checklist.md](./Production_Go_Live_Checklist.md)  
**Elie / content tracker:** [Elie_Response_Tracker.md](./Elie_Response_Tracker.md)

Track external answers needed for production go-live. Update this file when Adam or Wheels business replies.

## Answered (2026-08-09)

| Item | Asked in | Status | Response / notes |
| --- | --- | --- | --- |
| Email provider | [Email_to_Adam_Production_Followup.md](./Email_to_Adam_Production_Followup.md) | **Answered** | **SMTP on Wheels domain** — not Resend/SendGrid. Env-configurable (host, port, user, pass, encryption, from). Prod SMTP creds from Adam before go-live. Archive: [Adam_Response_Notifications_And_SMTP.md](./Adam_Response_Notifications_And_SMTP.md) |
| WhatsApp (launch) | Same | **Answered** | Direct contact link/button only (`wa.me`). No Meta Business API / Twilio for launch. Optional internal WhatsApp Bridge later for automation. |
| Wizard customer confirmations | Same | **Answered** | Website owns customer confirmation; send **after approval** (status sync). Wizard must not duplicate website booking emails. |
| Offline payments / receipt workflow | [Email_to_Adam_Offline_Payments_Vehicles_Images.md](./Email_to_Adam_Offline_Payments_Vehicles_Images.md) | **Answered** | No receipt upload / Pending Payment Review. Create booking request normally; pay later at handover. Store payment method → Wizard. Archive: [Adam_Response_Offline_Payments_Vehicles_Images.md](./Adam_Response_Offline_Payments_Vehicles_Images.md) |
| Duplicate / repeated cars | Same | **Answered** | Keep vehicles **individually** listed — do not group identical models. |
| Vehicle images source | Same | **Answered** | Wizard provides **no** images. Website CMS manages images manually (add/replace/assign/gallery). |

## Still open

| Item | Asked in | Status | Response / notes |
| --- | --- | --- | --- |
| Production SMTP credentials | Adam (Aug 9) | **Pending** | Needed before go-live email notifications |
| Deploy path (Vercel vs Adam SSH) | [Email_to_Adam_Production_Followup.md](./Email_to_Adam_Production_Followup.md) | **Pending** | Asked Jul 27; not answered in Aug 9 thread |
| Staging URL for Adam to try | Adam requested Aug 9 11:25 | **Blocked on us** | Tester pack ready: [Adam_Elie_Staging_Tester_Checklist.md](./Adam_Elie_Staging_Tester_Checklist.md) — send after deploy |
| Real bank transfer IBAN | Business / Elie | **Pending** | Placeholder in checkout copy today |
| Whish `WHISH_CHANNEL` / `WHISH_SECRET` | Business | **Pending** | Blocks Whish sandbox E2E; online payments deferred OK |
| Bank Audi NEO API docs + credentials | Business | **Pending** | Sandbox scaffold ready in code |
| Production `WIZARD_API_TOKEN` | Adam | **Blocked on us** | Request after Supabase + staging sign-off |

## Thread timeline (Jul 27 – Aug 9)

| Date | Who | Doc |
| --- | --- | --- |
| Jul 27 | Marc → Adam | [Email_to_Adam_Production_Followup.md](./Email_to_Adam_Production_Followup.md) |
| Jul 31 | Marc → Adam | [Email_to_Adam_Offline_Payments_Vehicles_Images.md](./Email_to_Adam_Offline_Payments_Vehicles_Images.md) |
| Aug 9 10:50 | Adam | [Adam_Response_Offline_Payments_Vehicles_Images.md](./Adam_Response_Offline_Payments_Vehicles_Images.md) |
| Aug 9 10:56 | Marc nudge | Notifications questions from Jul 27 |
| Aug 9 11:00 | Adam | [Adam_Response_Notifications_And_SMTP.md](./Adam_Response_Notifications_And_SMTP.md) |
| Aug 9 11:25 | Adam | Wants staging link Monday night Lebanon |
| Aug 9 11:33 | Marc | Will send link + checklist after implementing |
| Aug 9 12:31 | Adam | WhatsApp Bridge note (future) — same notifications archive |

## When Adam replies

1. Paste summary into the table above.
2. Update relevant launch gate doc (`LaunchGate_External_Signoff.md`, `Launch_Go_NoGo_Memo.md`).
3. Flip env flags / credentials in Vercel when applicable.
