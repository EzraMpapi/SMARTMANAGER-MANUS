# BusinessSphere ERP — Multi-Department Cost Center Tagging

## Overview
To provide transparent departmental spending accountability, **BusinessSphere ERP (Smart Manager)** supports multi-department cost-center tagging across all finance expenses.

---

## 1. Supported Departments & Cost Centers
- **Departments**: Operations, Sales, Finance, Warehouse, Admin
- **Cost Center Codes**: Automatically or manually tagged (e.g., `CC-OPS-01`, `CC-SALES-01`, `CC-FIN-01`, `CC-WH-02`, `CC-ADM-01`)

---

## 2. Persistence & Normalization
1. **Row Normalization (`mapExpenseRow`)**: Gracefully extracts `department`, `dept`, `cost_center`, `costCenter`, and `cost_code` from incoming PostgREST rows with robust fallback defaults (`Operations` and `CC-GENERAL`).
2. **Form Recording (`addExpense`)**: Captures department and cost center input from the record expense modal and persists them directly into the tenant-scoped `finance_expenses` table.
3. **Automated Testing**: Covered by integration regression specs verifying alias resilience and property preservation.
