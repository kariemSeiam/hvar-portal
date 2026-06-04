# Service Portal — Maintenance, Replacement, Return

> The feature that separates this from a basic storefront.
> This is the customer-facing mirror of the MCRM hub.

---

## The Design Principle

The MCRM has four service ticket types: HVM (صيانة), HVR (استبدال), HVT (مرتجع), HVS (بيع).
The new site exposes three of them to customers:

| MCRM Code | Arabic | Customer Flow |
|-----------|--------|--------------|
| HVM | صيانة — Maintenance | Product stopped working, needs repair |
| HVR | استبدال — Replacement | Product is defective, needs replacement |
| HVT | مرتجع — Return | Customer wants to return product |

HVS (Sell) is internal — created by MCRM agents, not customers.

---

## State Machines (Customer-Visible)

### صيانة (HVM — Maintenance)

```
PENDING           تم استلام الطلب
  ↓
HUB_RECEIVED      وصل المنتج للمركز
  ↓
IN_WORKSHOP       قيد الإصلاح
  ↓
READY             جاهز للاستلام
  ↓
CLOSED            تم الإغلاق ✓

CANCELLED         ملغي
FAILED            تعذر الإصلاح
```

**Customer description per state:**
| State | Customer-Facing Arabic | Expected Wait |
|-------|----------------------|--------------|
| PENDING | طلبك قيد المعالجة، سيتواصل معك فريقنا | ساعات |
| HUB_RECEIVED | وصل منتجك لمركز الخدمة، بدأنا التشخيص | ١ يوم عمل |
| IN_WORKSHOP | منتجك قيد الإصلاح الآن | ٢-٤ أيام عمل |
| READY | منتجك جاهز للاستلام أو الشحن | — |
| CLOSED | تم إغلاق الطلب بنجاح | — |

### استبدال (HVR — Replacement)

```
PENDING → HUB_RECEIVED → DISPATCHED → READY → CLOSED
```

| State | Customer-Facing Arabic |
|-------|----------------------|
| PENDING | طلب الاستبدال قيد المراجعة |
| HUB_RECEIVED | وصل منتجك لمركز الخدمة |
| DISPATCHED | المنتج البديل في الطريق |
| READY | جاهز للاستلام |
| CLOSED | تم الاستبدال بنجاح ✓ |

### مرتجع (HVT — Return)

```
PENDING → HUB_RECEIVED → INSPECTED → REFUNDED → CLOSED
```

| State | Customer-Facing Arabic |
|-------|----------------------|
| PENDING | طلب الإرجاع قيد المراجعة |
| HUB_RECEIVED | وصل المنتج لمركز الفحص |
| INSPECTED | تم الفحص، جاري معالجة الاسترداد |
| REFUNDED | تم رد المبلغ |
| CLOSED | تم إغلاق الطلب ✓ |

---

## New Service Request Form

### Step 1 — اختر نوع الطلب

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│   ماذا تريد؟                                         │
│                                                      │
│  ┌────────────────┐  ┌────────────────┐              │
│  │                │  │                │              │
│  │   🔧  صيانة    │  │   🔄 استبدال   │              │
│  │                │  │                │              │
│  │ المنتج لا يعمل │  │ منتج معيب      │              │
│  │ بشكل صحيح      │  │ يحتاج استبدال │              │
│  └────────────────┘  └────────────────┘              │
│                                                      │
│  ┌────────────────┐                                  │
│  │                │                                  │
│  │   ↩️  مرتجع    │                                  │
│  │                │                                  │
│  │ أريد إرجاع     │                                  │
│  │ المنتج         │                                  │
│  └────────────────┘                                  │
└──────────────────────────────────────────────────────┘
```

### Step 2 — تفاصيل المشكلة

```
  المنتج المعني:
  ┌──────────────────────────────────────────────┐
  │ بحث من طلباتي السابقة... أو اكتب اسم المنتج│
  └──────────────────────────────────────────────┘

  وصف المشكلة: *
  ┌──────────────────────────────────────────────┐
  │                                              │
  │ (min 20 chars, Arabic)                       │
  └──────────────────────────────────────────────┘

  صور (اختياري)
  [ + إضافة صورة ]
```

### Step 3 — بيانات التواصل والاستلام

```
  رقم الهاتف: *
  [ 01X XXXX XXXX ]

  عنوان الاستلام: *
  [محافظة ▼] [مدينة ▼]
  [العنوان التفصيلي...]

  تاريخ مناسب للاستلام (اختياري):
  [__/__/____]

  [إرسال الطلب]
```

---

## DB Writes on Ticket Creation

```sql
INSERT INTO service_tickets (
  type,           -- 'HVM' / 'HVR' / 'HVT'
  status,         -- 'PENDING'
  contact_id,     -- contacts.id (resolved from phone)
  transaction_id, -- NULL if not linked to a specific order, otherwise orders.id
  product_id,     -- products.id if known
  notes,          -- Customer description of the problem
  created_at,
  updated_at
)
```

If the customer selected from their previous orders, populate `transaction_id`. MCRM will use this to link the ticket to the original sale.

---

## Ticket List Page

**URL:** `/service`

```
┌────────────────────────────────────────────────────────┐
│  طلبات الخدمة                                          │
│                                                        │
│  [صيانة] [استبدال] [مرتجع]  ← filter tabs             │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ #HVM-2024-0087  مكواة برافيا                    │  │
│  │ قيد الإصلاح ●amber   Jun 3, 2024                │  │
│  │                               [عرض التفاصيل →]  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │ #HVR-2024-0041  خلاط كينود                      │  │
│  │ تم الاستبدال بنجاح ●green   May 28, 2024        │  │
│  │                               [عرض التفاصيل →]  │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

**API:** `GET /api/tickets?type=HVM&status=:status&page=1`

---

## Ticket Detail Page

**URL:** `/service/:id`

```
┌──────────────────────────────────────────────────────────┐
│  طلب صيانة                         #HVM-2024-0087       │
│                                                          │
│  المنتج: مكواة برافيا                                    │
│  تاريخ الفتح: ١ يونيو ٢٠٢٤                              │
│  الحالة الحالية: قيد الإصلاح                             │
│                                                          │
│  ════ المراحل ════                                        │
│                                                          │
│  ✓  تم استلام الطلب                  ١ يونيو، ٠٩:٠٠     │
│  ✓  وصل المنتج لمركز الخدمة          ٢ يونيو، ١١:٣٠     │
│  ● ← قيد الإصلاح الآن               ٣ يونيو، ١٤:٠٠     │
│  ○  جاهز للاستلام                    —                   │
│  ○  تم الإغلاق                       —                   │
│                                                          │
│  الوقت المتوقع للإنتهاء: ٥ يونيو ٢٠٢٤ (تقريبي)          │
│                                                          │
│  ملاحظات من الفريق: (shown if MCRM added public notes)  │
│                                                          │
│  [تواصل معنا عبر واتساب]                                  │
└──────────────────────────────────────────────────────────┘
```

**Data from DB:**
```sql
SELECT st.*, c.name as customer_name, p.name as product_name,
       t.website_order_id as order_ref
FROM service_tickets st
LEFT JOIN contacts c ON c.id = st.contact_id
LEFT JOIN products p ON p.id = st.product_id
LEFT JOIN transactions t ON t.id = st.transaction_id
WHERE st.id = :id AND st.contact_id = :current_customer_id
```

Note: `service_ticket_history` table (if exists in MCRM) logs state transitions with timestamps.
If it doesn't exist, derive timeline from `created_at` + `updated_at` + current `status`.

---

## State-to-Color Mapping

| State | Arabic | Color | Tailwind |
|-------|--------|-------|---------|
| PENDING | قيد المعالجة | Slate | `text-slate-500 bg-slate-50` |
| HUB_RECEIVED | في المركز | Blue | `text-blue-600 bg-blue-50` |
| IN_WORKSHOP | قيد الإصلاح | Amber | `text-amber-600 bg-amber-50` |
| DISPATCHED | في الطريق | Purple | `text-purple-600 bg-purple-50` |
| INSPECTED | تم الفحص | Blue | `text-blue-600 bg-blue-50` |
| READY | جاهز | Green | `text-green-600 bg-green-50` |
| REFUNDED | تم الرد | Green | `text-green-600 bg-green-50` |
| CLOSED | مغلق | Emerald | `text-emerald-600 bg-emerald-50` |
| CANCELLED | ملغي | Red | `text-red-600 bg-red-50` |
| FAILED | تعذر | Red | `text-red-600 bg-red-50` |

---

## Linking Service Tickets to Orders

When the customer opens a service request AND they were logged in when they placed the order:
- Show their recent orders in a dropdown
- Customer selects which order the product is from
- This sets `transaction_id` on the service ticket
- MCRM agents can see the full purchase history when working the ticket

When no order is found (gift, cash purchase, old order):
- Customer manually describes the product
- No `transaction_id` — MCRM handles lookup manually

---

## WhatsApp Integration

WhatsApp is the primary support channel. Every service-related page shows a WhatsApp CTA:

```
Number: 01204444196
Pre-filled message per context:

Order tracking:
  "مرحباً، أريد الاستفسار عن طلبي رقم HVAR-20240601-0042"

New maintenance request:
  "مرحباً، أريد فتح طلب صيانة لمنتج [اسم المنتج]"

General:
  "مرحباً، أريد الاستفسار"

URL format:
  https://wa.me/201204444196?text={encodeURIComponent(message)}
```

The WhatsApp FAB is always visible (bottom-left in RTL) across the entire site.
