# Bosta Search Result Screen

Two-panel layout: identity (customer, Bosta orders) + content (tickets, FAB actions). ServiceModalViewer styling. RTL, Cairo. Used when operator searches by phone/tracking in Bosta mode.

---

## Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  [Smart Search Bar + Filter: customer | tracking | ticket | order] │
├────────────────────────────┬────────────────────────────────────┤
│  LEFT (2/5)                 │  RIGHT (3/5)                        │
│  Customer (collapsible)    │  Tickets (drafts amber first)       │
│  Bosta orders list         │  FAB rail: استبدال صيانة إرجاع بيع  │
│  Drafts + confirmed        │  Order cards / NewCustomerForm     │
└────────────────────────────┴────────────────────────────────────┘
```

---

## Flows

| Trigger | Outcome |
|---------|---------|
| customerData exists | Identity + orders + FAB; select order → action type → UnifiedServiceActionModal |
| searchResultEmpty | "عميل جديد" + NewCustomerForm; create → re-run search |
| Click existing ticket | ServiceModalViewer |
| Draft created | Amber card, pulse; call / complete / delete |

---

## Key elements

- **Panel A:** CustomerCard, LocationCard, BostaOrdersList, BostaTicketsSection (drafts first).
- **Panel B:** BostaFABRail (استبدال, صيانة, إرجاع, المبيعات), BostaTicketsSection, BostaOrdersGrid or NewCustomerForm.
- **Modals:** UnifiedServiceActionModal (create), ServiceModalViewer (view).

Files: `index.jsx`, BostaIdentityPanel, BostaContentPanel, BostaDataTabs, BostaOrderItem, ServiceTicketItem, NewCustomerForm, BostaSearchResultSkeleton.

---

## Design: Result states

### 1. Customer exists (`customerData` set)

**Panel A — BostaIdentityPanel**
- Collapsible summary bar (when collapsed): avatar, name, phone, "عرض". Expand to show full content.
- Expanded: **CustomerCard** (name, phones, copy), **LocationCard** (محافظة, مدينة, عنوان), **BostaTicketsSection** ("تذاكر الخدمة").
- Styling: `rounded-2xl`, white/dark card, `border-gray-200 dark:border-gray-700`.

**Panel B — BostaContentPanel**
- **BostaOrdersList** (order list).
- Card header: "الطلبات" + count if any.
- **BostaOrdersGrid**: order cards (select, lock, Bosta link, status, COD). Empty state: "لا توجد طلبات Bosta متاحة".

---

### 2. Customer not found (`customerData` null)

**Panel A — BostaIdentityPanel (empty state)**
- Single card, same container style.
- Amber icon (person + plus), close button.
- **"عميل جديد"** (bold).
- **"لم يتم العثور على العميل"** (subtext).
- If `searchQuery`: **"البحث: {searchQuery}"** (trimmed, `dir="ltr"`).

**Panel B — BostaContentPanel**
- **Service type card** (centered):
  - "ابدأ بإنشاء طلب خدمة"
  - "اختر نوع الخدمة"
  - 2×2 grid: **BOSTA_FAB_ACTIONS** (استبدال, صيانة, إرجاع, المبيعات) — solid bg, icon + label, min-h ~64px.
- **NewCustomerForm** (below):
  - Header: "إنشاء عميل جديد" (amber accent strip + icon), close.
  - Fields: الاسم*, رقم الهاتف*, رقم ثانوي, المحافظة, المدينة, تفاصيل العنوان.
  - Footer: "* الحقول المطلوبة" + "إنشاء العميل" (green CTA; loading: "جاري الإنشاء...").
  - Governorates from `EGYPTIAN_GOVERNORATES` (constants).
