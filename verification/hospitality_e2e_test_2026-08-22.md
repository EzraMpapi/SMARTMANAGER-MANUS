# Hospitality End-to-End Integration Test

**Date:** 22 August 2026  
**Method:** Controlled live workflow test using the production Hospitality command procedures. Test records were explicitly tagged and removed after verification.

## Scenario executed

A temporary Tanzania-ready property, room type, room, guest profile, confirmed reservation, open folio, restaurant menu, menu item, restaurant table, and POS order were created through the same secured procedures used by the Hospitality workspace. The workflow then performed the following sequence:

1. Create a TZS property, room type, and room.
2. Create a guest profile and confirmed one-night reservation for the assigned room.
3. Check the guest in, moving the room to `Occupied` and opening a folio.
4. Create a restaurant order, add a TZS 30,000 dining item, transition the kitchen order to `Ready`, and post it as a room charge.
5. Record a matching TZS 30,000 cash payment.
6. Check out the guest, closing the balanced folio, moving the room to `Dirty`, and creating a checkout-clean task.
7. Complete the housekeeping task, returning the room to `Available`.

## Assertions and result

| Assertion | Expected result | Actual result | Outcome |
| --- | --- | --- | --- |
| Reservation lifecycle | `Checked Out` after checkout | `Checked Out` | Pass |
| POS lifecycle | Room-charge order posted and settled | `Paid` | Pass |
| Folio calculation | TZS 30,000 dining charge offset by TZS 30,000 payment | Balance `0` | Pass |
| Folio lifecycle | Closed only after a zero balance | `Closed` | Pass |
| Housekeeping lifecycle | Checkout creates task; completion releases room | Task `Completed`; room `Available` | Pass |
| Room availability | Room becomes sellable after cleaning | `Available` | Pass |
| Audit pathway | Every command emitted a tagged audit event | 16 tagged entries created during run | Pass |
| Cleanup integrity | No test records remain | 0 properties, guests, reservations, orders, and tagged audit entries remaining | Pass |

## Test outcome

The live integration test passed end to end. The database enforced the reservation-to-folio-to-POS-to-payment-to-checkout-to-housekeeping sequence and produced the expected financial and operational state transitions. No controlled test records remain in the production tenant.
