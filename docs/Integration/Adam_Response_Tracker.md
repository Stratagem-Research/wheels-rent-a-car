# Adam / Wheels Response Tracker

Status: Open  
Owner: Marc  
Last updated: 2026-07-27

**Master go-live order:** [Production_Go_Live_Checklist.md](./Production_Go_Live_Checklist.md)

Track external answers needed for production go-live. Update this file when Adam or Wheels business replies.

| Item | Asked in | Status | Response / notes |
| --- | --- | --- | --- |
| Email provider (Resend vs SendGrid) | [Email_to_Adam_Production_Followup.md](./Email_to_Adam_Production_Followup.md) | **Pending** | Follow-up **reviewed** 2026-07-27; Marc to send |
| WhatsApp number + provider (Twilio?) | Same | **Pending** | Launch email-only if not ready |
| Does Wizard send customer booking confirmations? | Same | **Pending** | Avoid duplicate messages |
| Deploy path (Vercel vs Adam SSH) | Same | **Pending** | |
| Real bank transfer IBAN | TBD | **Pending** | Placeholder in checkout copy today |
| Whish `WHISH_CHANNEL` / `WHISH_SECRET` | Business | **Pending** | Blocks Whish sandbox E2E |
| Bank Audi NEO API docs + credentials | Business | **Pending** | Sandbox scaffold ready in code |
| Production `WIZARD_API_TOKEN` | Adam | **Blocked on us** | Request after Supabase + staging sign-off |
| Staging URL review / approval | Us → Adam | **Blocked on us** | After Vercel staging deploy |

## When Adam replies

1. Paste summary into the **Response / notes** column above.
2. Update relevant launch gate doc (`LaunchGate_External_Signoff.md`, `Launch_Go_NoGo_Memo.md`).
3. Flip env flags / credentials in Vercel when applicable.
