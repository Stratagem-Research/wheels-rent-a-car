# Adam / Elie — Staging Tester Checklist

Status: Ready to send with staging URL  
Owner: Marc (send) · Fatema (staging ready)  
Last updated: 2026-08-10

Use this after staging is live. Share the customer URL + admin URL (credentials via secure channel). Add feedback in a shared doc or reply by email.

## Access

| Item | Value |
| --- | --- |
| Customer staging URL | _TBD — paste after deploy_ |
| Admin URL | `{staging}/admin` |
| Admin credentials | Secure channel only |

Demo Wizard only — do not create production bookings.

## Please try

| # | Task | Pass / notes |
| --- | --- | --- |
| 1 | Browse fleet — similar cars appear as **separate** cards (not one grouped model) | |
| 2 | Admin → Fleet: **upload** a car photo, Save, confirm it shows on the customer fleet | |
| 3 | Admin → About: **upload** a team photo, Save, confirm it shows on `/about` | |
| 4 | Book with **Cash** — copy should say request received / pay at pickup (not “payment verified”) | |
| 5 | Book with **Bank transfer** — no receipt upload; pending / pay later | |
| 6 | Book with **OMT** — same as transfer | |
| 7 | Tap the WhatsApp button — opens chat (`wa.me`), customer starts the conversation | |
| 8 | Manage booking: look up by reference + email | |
| 9 | Any copy / layout / content feedback — paste into shared doc | |

## Reminders (product rules)

- Offline payment = booking **request** received; payment usually at handover.  
- Formal confirmation email is sent by the website **after** Wizard approval.  
- Vehicle images are managed on the website (admin upload), not from Wizard.

## Still need from Adam

1. Deploy path: Vercel on your domain vs SSH/server  
2. Production SMTP credentials (host, port, user, pass, encryption, from email/name)  

## Still need from Elie

Team photos (can now upload in admin), site review doc, corporate pricing, bank IBAN for checkout copy.
