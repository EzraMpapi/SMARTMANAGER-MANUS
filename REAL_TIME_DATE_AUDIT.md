# BusinessSphere ERP — Real-Time Date & Time Architecture Audit

## Executive Summary
This document reviews how date and time are initialized, stamped, filtered, and displayed across **BusinessSphere ERP (Smart Manager)**. To eliminate stale dates or hard-coded assumptions, the application uses dynamic runtime date extraction (`new Date()`) for all new records, report intervals, command-strip headers, and scheduled tasks.

---

## 1. Dynamic Date Extraction Strategy

| Component / Flow | Date Source | Persistence & Timezone Handling |
|---|---|---|
| **Executive Command Strip** | `new Date()` (live locale-formatted) | Refreshes on mount and render; respects user browser timezone |
| **New Loans & Repayments** | `new Date().toISOString().slice(0, 10)` | ISO UTC date strings stored in Supabase (`borrowed_date`, `repayment_date`) |
| **Expenses & Invoices** | `new Date().toISOString().slice(0, 10)` | Accurate calendar day stamps on creation |
| **Analytics & Cash Flow** | Dynamic period start calculation based on `new Date()` year/month | Real-time filtering against `This Month`, `This Quarter`, `Year-to-Date`, and `All Time` |
| **Scheduled Reports** | UTC timestamp generation (`Date.now()`) | Background cron & Resend delivery integration via Heartbeat task IDs |

---

## 2. Best Practices Enforced
1. **No Stale Constants**: Global module variables relying on static evaluation are wrapped or computed dynamically using getter hooks or `new Date()`.
2. **ISO 8601 Database Persistence**: All database date fields store standard YYYY-MM-DD or Unix millisecond epoch values in UTC, avoiding tz drift.
3. **Localized Presentation**: Client-side rendering formats timestamps using browser locale settings (`toLocaleDateString`) while maintaining UTC integrity in the backend.
