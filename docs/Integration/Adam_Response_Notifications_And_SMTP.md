> **Status: RECEIVED from Adam.** Archived 2026-08-09 (thread pasted 2026-08-10).

# Adam response — customer notifications, SMTP, WhatsApp

**From:** Adam (069 Design / Wizard team) `<adam@069design.de>`  
**To:** Marc, Elie, Fatema  
**Date:** Sun, Aug 9, 2026, 11:00 AM (notifications) · 12:31 PM (WhatsApp bridge note)  
**In reply to:** Marc nudge 2026-08-09 10:56 AM (points from [Email_to_Adam_Production_Followup.md](./Email_to_Adam_Production_Followup.md) / Jul 27)

---

## 1. Notifications reply (11:00 AM)

Hi Marc,

Thanks for following up.

Please proceed as follows regarding customer notifications:

### Email provider

We do not want to use Resend or SendGrid at this stage.

Email notifications should be sent via **SMTP using our own Wheels domain and mail server**.

Please therefore keep the email configuration SMTP-based and configurable through the environment/settings, including:

- SMTP host
- SMTP port
- SMTP username
- SMTP password
- Encryption
- From email
- From name

We will provide the final production SMTP credentials before go-live.

### WhatsApp

We do not require a Meta Business verified WhatsApp API number or a Twilio integration for the initial website.

For now, WhatsApp on the website should simply provide a **direct contact link/button** to our WhatsApp number so that the customer can initiate the conversation themselves.

This can be implemented using a standard WhatsApp link/integration and does not require automated outbound WhatsApp messaging.

The important point is that the customer initiates the first contact.

If we later decide to introduce automated WhatsApp notifications, we can add a proper WhatsApp Business API integration separately.

### Wizard customer confirmations

For bookings coming through the website, the customer-facing confirmation should be handled by the website.

The website should send the confirmation **only once the booking/request has been approved**.

Wizard itself should remain the operational backend and should **not** create a duplicate customer-facing confirmation for the same website booking.

So the intended flow is:

1. Customer submits booking request on the website  
2. Booking/request is transferred to Wizard  
3. Booking is reviewed/approved  
4. Website receives the corresponding status  
5. Website sends the customer confirmation after approval  

This keeps all website-originated customer communication consistent and avoids duplicate emails.

Best,  
Adam

---

## 2. Staging request (11:25 AM)

> Ok I will be at Monday night back ok lebanon - if you can send me a link to Check and try would be great.

Adam asked for a staging/check link (Lebanon Monday night ≈ 2026-08-10 evening).

Marc replied (11:33 AM): implement features, then send link + checklist for Adam and Elie to test / annotate feedback.

---

## 3. WhatsApp bridge note (12:31 PM)

One additional note regarding WhatsApp:

In the internal system, Adam normally uses a **WhatsApp Bridge** where the WhatsApp account is linked through a QR-code authentication process similar to WhatsApp Web, running through Chromium.

So instead of Twilio or the official Meta WhatsApp API, the system can connect to an existing WhatsApp account through this bridge.

For the **initial website launch**, only the direct WhatsApp contact link/button is required. The bridge would only become relevant if later automated WhatsApp messages are desired.

Marc acknowledged (12:33 PM).

---

## Implementation implications

| Decision | Action for website |
| --- | --- |
| SMTP, not Resend/SendGrid | Prefer SMTP env config for transactional mail; do not require Resend for launch |
| Adam provides prod SMTP creds | Track as pending credential from Adam before go-live |
| WhatsApp = `wa.me` / contact link only | Keep FAB + inline links; **no** outbound WhatsApp API at launch |
| Bridge = future / optional | Out of launch scope; note only |
| Confirmation after **approval** | Trigger customer email on approved status sync from Wizard — not (only) at submit |
| No Wizard duplicate emails | Website owns customer-facing confirmation for website bookings |

**Copy distinction vs offline-payment reply:**  
[Adam_Response_Offline_Payments_Vehicles_Images.md](./Adam_Response_Offline_Payments_Vehicles_Images.md) allows an immediate “we received your booking **request**” acknowledgement. This reply locks the formal booking confirmation to **post-approval**. Both can coexist if product copy separates “request received” vs “booking confirmed”.
