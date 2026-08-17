# Controlled POS Staging and Retry Acceptance Evidence

## Authorization and boundaries

On 17 August 2026, the user explicitly confirmed that the active **KMKM** workspace is the dedicated staging tenant for this test. The test was limited to the existing open **Ezra Income** shift and the existing archived QA inventory item **QA POS Acceptance Item 20260816**. No customer data, payment credential, printer profile, shift closure, cash movement, or non-QA product was used.

## Confirmed temporary sale

One cash guest sale of one QA item was completed through the authenticated POS form. The application displayed receipt `POS-20260817-970E`, a paid total of TZS 1k, and the expected quantity decrease from three to two.

Direct server verification confirmed exactly one completed transaction, exactly one line item, one transaction commit, and one synchronized reconciliation event. The sale used the app-generated idempotency key rather than relying on client-side success state.

| Contract | Verified result |
| --- | --- |
| POS transaction header | One completed server row |
| Line item | One QA SKU line with quantity one |
| Commit record | One server commit with the sale idempotency key |
| Reconciliation event | One `synced` event for the transaction |
| Quantity before cleanup | QA inventory changed from three to two only after confirmation |

## Controlled retry boundary

The same exact POS completion request was replayed through the authenticated browser session with the original idempotency key. The server returned HTTP 200, the original transaction ID, and `idempotent_replay: true`. A follow-up database count confirmed one transaction, one line item, one commit, and one sync event—no duplicate sale or duplicate inventory reduction occurred.

The server-side database administrator channel correctly refused the same RPC without an authenticated workspace session. This confirms that the production POS completion function continues to require user session context rather than allowing privileged administrative replay.

## Cleanup verification

The approved temporary transaction, its item, commit, and sync event were deleted in one database transaction. The QA inventory quantity was restored from two back to three. Final direct verification returned zero temporary transaction, item, commit, and sync-event rows, with `qty_on_hand = 3` for the existing QA item.

## Remaining device limits

This validates the browser-to-server sale and idempotent replay boundary. It does not validate physical printer output, a browser Save-as-PDF dialog, mobile-device flows, or a visual pending-queue retry after a real transport failure; each still requires the corresponding supported device or controlled failure environment.
