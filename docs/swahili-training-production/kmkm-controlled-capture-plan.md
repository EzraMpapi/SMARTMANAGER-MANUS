# KMKM Controlled Training Capture Plan

## Approval and boundary

The owner approved `KMKM` as a demonstration tenant for the SMART MANAGER Kiswahili training production. That approval is limited to **controlled redacted orientation frames**. It does not authorize publication of customer names, SKU names, invoices, quotations, account/profile information, numeric KPIs, financial amounts, dates, notification badges, credentials, tokens, exports, or private record detail.

## Source-to-output pipeline

| Source surface | Preserved source location | Training output | Permitted instructional use |
|---|---|---|---|
| Dashboard | External private workspace: `kmkm-private-source/dashboard-owner.webp` | `kmkm-redacted/dashboard-training-redacted.png` | Show that a role-aware module rail exists; pair with explanatory 3D dashboard visuals. |
| Finance | External private workspace: `kmkm-private-source/finance-owner.webp` | `kmkm-redacted/finance-training-redacted.png` | Introduce Finance as a workspace family; do not show figures or reports. |
| Inventory | External private workspace: `kmkm-private-source/inventory-owner.webp` | `kmkm-redacted/inventory-training-redacted.png` | Introduce stock/warehouse workflow family; use 3D animation for steps. |
| Sales | External private workspace: `kmkm-private-source/sales-owner.webp` | `kmkm-redacted/sales-training-redacted.png` | Introduce quotation/order/invoice workflow family; use 3D animation for steps. |

The private sources and redacted outputs remain outside the Git repository. The deterministic implementation is versioned at `scripts/redact_kmkm_training_captures.py`.

## Redaction method

The utility masks the whole header, tenant/profile identity zone, all record-bearing main workspace regions, and the lower dynamic rail edge. It preserves only a generic portion of the module rail and overlays a caption stating that the image is a redacted KMKM demonstration training frame. The reviewed dashboard output contains generic module orientation only; no visible account, tenant, financial, customer, stock, quote, or notification data remains.

> This is not a “blur” policy. It is a removal policy: record-bearing regions are replaced by a solid training background, not merely obscured.

## Editorial rule

Every controlled UI frame must sit beside one of the registered 3D concept visuals or a purpose-built generic workflow animation. The UI frame may orient the learner to a workspace; the 3D asset and narration explain the workflow. Captions must avoid terms such as “live results,” “current balance,” or “customer record” unless a separately approved redacted capture contains the exact evidence.

## Review status

The dashboard training frame was visually reviewed after the hardened redaction pass. The dynamic `Sales` badge observed in the first pass was removed. The remaining frame is suitable for module-shell orientation only. Finance, Inventory, and Sales outputs are generated through the same masking protocol and require the same final editor checklist before use.
