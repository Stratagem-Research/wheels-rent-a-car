> **Status: SENT by Marc (2026-07-31).** Adam replied 2026-08-09 — see [Adam_Response_Offline_Payments_Vehicles_Images.md](./Adam_Response_Offline_Payments_Vehicles_Images.md).

# Email to Adam — offline payments, duplicate cars, vehicle images

**To:** Adam (069 Design / Wizard team)  
**Cc:** Fatema, Elie  
**Subject:** Booking flow clarifications — offline payments, fleet display, images  
**Sent:** Fri, Jul 31, 2026, 8:56 PM

---

Hi Adam,

We wanted to clarify a few additional points to ensure we implement the booking flow correctly:

## Pending bookings and offline payments

When a customer goes through the booking process and selects a payment method such as OMT or bank transfer, how would you like the approval process to work?

For example, we could allow the customer to upload a payment receipt/screenshot and enter the transaction or reference number. The booking would then move into a Pending Review status.

From there, should the verification and approval happen through your API, or would you prefer us to add a section to the admin dashboard where your team can:

- See all pending payments/bookings
- Review the receipt and transaction details
- Verify the payment against your OMT or bank account
- Approve or reject the booking

Please let us know which flow you prefer.

## Duplicate / repeated cars

Right now, we are seeing multiple identical cars returned and displayed to the customer. Is this meant to represent the available quantity of that vehicle?

For example, if there are 12 identical cars available, do you want all 12 to appear separately on the customer side, or should we show the car only once and manage the available quantity and allocation through the backend?

## Car images

How will the vehicle images be provided? Will the image URLs come directly through your API, will you provide us with S3 links, or will you provide the image files and have us store and manage them in S3?

Once we clarify these three points, we can ensure the booking and inventory flows are implemented correctly.

Best,  
Marc
