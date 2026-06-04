# Ticket/Order Card — Important Fields & Unified Layout (UI/UX)

> **Goal:** Every ticket and order card uses the same **creative structure** and shows all critical info so agents see everything at a glance.

---

## Unified card structure (best fit)

Both **Bosta orders** and **تذاكرنا tickets** use the same layout:

| Zone | Orders | Tickets |
|------|--------|---------|
| **Strip** | 4px red (Bosta brand) | 4px by type (استبدال أزرق، صيانة كهرماني، إرجاع أحمر، بيع أخضر) |
| **Icon** | Package (red box) always | Type icon (RotateCcw, Wrench, Truck, Package) in type gradient |
| **Content** | متاح/مغلق + تذكرة when locked, tracking link, نوع/حالة, وصف الطرد, footer | Type badge + ticket# + status badge, notes block, cost+items bar, tracking chips, footer |
| **Footer** | Clock + relative time | Clock + relative time |

Only show blocks when data exists (وصف الطرد, الملاحظات, التكلفة/العناصر). Same padding, same hover (red border + light red bg), same list height `min(70vh, 480px)`.

---

## Must show on cards (when present)

| Field | Where | Card display |
|-------|--------|---------------|
| **Notes** | `ticket.notes` | Block "الملاحظات" (icon + label), truncate + "عرض المزيد" / "عرض أقل". |
| **Cost** | `ticket.cost_adjustment` | Pill "التكلفة: X ج.م" in cost+items bar (green). |
| **Items** | `ticket.items` + `direction` | "إرسال N · استلام M" or "N قطعة" (بيع). |
| **Status** | Order/ticket status | Colored badge (متاح/مغلق + نوع for orders; مسودة/مؤكد/مكتمل etc. for tickets). |

**Data:** List API returns `notes`, `cost_adjustment`, `items` (with `direction`). Orders: `trackingNumber`, `package.description`, `type`, `status`, timestamps.

---

## Where implemented

- **Bosta panel → طلبات Bosta:** `BostaOrdersGrid.jsx` — strip + icon + متاح/مغلق, تذكرة, tracking, وصف الطرد, footer.
- **Bosta panel → تذاكرنا:** `BostaTicketsSection.jsx` — strip + type icon + type + ticket# + status badge, notes block, cost+items bar, tracking, footer.
- **Service modal:** `ServiceModalViewer.jsx` — full notes, cost, send/receive columns.

Use this structure for any new ticket/order card so UX stays consistent.
