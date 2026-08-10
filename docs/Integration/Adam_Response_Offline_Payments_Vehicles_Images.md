> **Status: RECEIVED from Adam.** Archived 2026-08-09 (thread pasted 2026-08-10).

# Adam response — offline payments, duplicate cars, vehicle images

**From:** Adam (069 Design / Wizard team) `<adam@069design.de>`  
**To:** Marc, Elie, Fatema  
**Date:** Sun, Aug 9, 2026, 10:50 AM  
**In reply to:** [Email_to_Adam_Offline_Payments_Vehicles_Images.md](./Email_to_Adam_Offline_Payments_Vehicles_Images.md)

---

Hi Marc,

Thanks for the clarification questions. Please implement the three points as follows:

## Offline payments / OMT / bank transfer

For offline payment methods, we do not need a separate payment approval or receipt verification workflow at this stage.

The booking request should be created normally once the customer completes the booking process.

The website can immediately send the customer a confirmation that we have received the booking request.

The actual payment will then be handled directly with the customer, generally upon arrival / vehicle handover.

Therefore, there is currently no requirement for:

- Receipt or screenshot upload
- Transaction reference verification
- Pending Payment Review dashboard
- Manual payment approval before accepting the request

The important distinction is that the website confirmation confirms receipt of the booking request. It does not need to confirm that an offline payment has already been verified.

The selected payment method should of course still be stored with the booking and transferred to Wizard where applicable.

## Duplicate / repeated cars

Please keep the individual vehicles visible separately.

Even if several vehicles are the same model, we do not want them grouped into one single vehicle card.

For example, if we have 12 vehicles of the same or a very similar model, they may appear as separate available vehicles.

This is intentional from the customer experience perspective. If we grouped the entire fleet into only a few model cards, a customer could get the impression that Wheels only has three or four cars available, while in reality the fleet consists of many individual vehicles.

Wizard manages each physical vehicle individually, so the website should reflect that fleet depth as well.

We can later improve the presentation so that repeated models do not look visually monotonous, but they should remain individual bookable vehicles.

## Vehicle images

Wizard currently does not provide vehicle images through the API.

The vehicle images therefore need to be added and managed manually on the website side.

For the initial setup, the images can be sourced manually from official manufacturer/media pages or other permitted sources and then assigned to the corresponding vehicles/models.

Please structure the image management so that images can easily be:

- Added manually
- Replaced
- Updated
- Assigned to the relevant vehicle
- Expanded with additional gallery images later

We should not depend on Wizard for image delivery.

The vehicle data, availability and booking information will continue to come from Wizard, while the website manages the visual vehicle presentation separately.

## Summary (Adam)

- Offline payment: booking request is accepted; payment is handled with the customer later
- Customer can receive a booking **request** confirmation immediately from the website
- No payment receipt approval workflow is required for now
- Vehicles remain individually displayed
- Wizard provides no images
- Vehicle images are maintained manually on the website

Best,  
Adam

---

## Implementation implications

| Decision | Action for website |
| --- | --- |
| No receipt / Pending Payment Review | Do **not** build receipt upload or payment-approval admin for launch |
| Offline = request + pay later | Store payment method; sync to Wizard; copy = “request received”, not “payment verified” |
| Keep duplicate vehicles | Do **not** group/dedupe identical models in fleet UI |
| Images website-owned | CMS / `vehicle_metadata` image management; no Wizard image dependency |

**Related nuance (same day):** Adam later clarified formal customer confirmation timing in [Adam_Response_Notifications_And_SMTP.md](./Adam_Response_Notifications_And_SMTP.md) — website sends the post-**approval** confirmation; the Aug 9 10:50 note above is about acknowledging the **request**, not verifying offline payment.
