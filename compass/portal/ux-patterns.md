# UX Patterns — hvarstore.com

> The complete UX contract for the customer portal. Every pattern here is a decision, not a suggestion. If something is not listed, design it from these principles. If a future design contradicts this document, the contradiction is intentional and must be documented.

---

## 1. The Egyptian Buyer Journey

This is the real journey. Not the one that looks good in a journey map.

### Stage 1: Discovery via recipe content

A woman is on Facebook or TikTok. A recipe video appears — Chef Sara making ملوخية, or a quick كنافة tutorial. The food is interesting. The appliance used produces a result she can imagine in her own kitchen. She shares the video to a WhatsApp group: "شوفوا الوصفة دي." She does not visit hvarstore.com yet.

### Stage 2: Re-engagement days or weeks later

Someone in the WhatsApp group asks "الجهاز ده من فين؟" A link is shared. Or she sees another Hvar video and this time decides to look. She navigates to hvarstore.com on her phone. She browses with evaluation intent, not purchase intent. The question she is answering: is this brand real? Can I trust it?

### Stage 3: Trust assessment on the PDP

She reaches a product detail page. She reads: price, warranty, whether shipping is free, whether she can pay on delivery. She may go look up the brand on Facebook to see if comments are real. Trust is not built on the page alone — it is built across the brand's total presence.

### Stage 4: The pre-purchase contact (the trust check)

For many Egyptian buyers, especially above a certain price point: she contacts via WhatsApp before completing the order. "إيه الفرق بين المنتج ده والتاني؟" The WhatsApp channel is a sales channel. The buyer who calls has already decided they might buy; they need one more confirmation.

### Stage 5: Cart and checkout

She adds to cart. On mobile, this should feel like confident forward motion — not obstacles. She selects COD. She enters her address using the governorate + district dropdowns. She reviews the order summary and confirms.

### Stage 6: Post-order and loop

She tracks her order. When it arrives, she inspects before paying — this is the COD promise and must be honored. After delivery, she shares her experience in the WhatsApp group. This is the loop: customer → community → next customer.

### Design implications

- Trust signals are closing mechanics, not decoration. They belong at every hesitation point.
- The WhatsApp contact option must always be accessible — PDP, cart, checkout, order page.
- The checkout must not feel like a form barrier — natural forward motion.
- Post-purchase communication is part of the product. Order confirmation + delivery update + COD inspection moment = the full experience.
- The buyer may share a link from desktop and complete on mobile. Multi-device journeys are the norm.

---

## 2. Trust Architecture

Trust signals in hvarstore.com are closing mechanics placed at specific hesitation points. A trust signal in the wrong place does nothing. A trust signal missing at the right moment loses the sale.

### The Four Trust Pillars

| Trust Element | What it says psychologically | Where it must appear |
|--------------|------------------------------|---------------------|
| **COD — ادفع لما الطلب يوصل** | "We trust you. You don't risk anything." | PDP below price, cart summary, checkout step 1, cart drawer |
| **Warranty (2–3 years)** | "This product is built to last. We stake money on it." | PDP product info section, product card, post-checkout confirmation |
| **Free shipping — شحن مجاني** | "No hidden cost. The price you see is the price you pay." | PDP below price, cart summary, checkout |
| **Installments — ValU/Souhoola/Aman** | "You don't have to pay everything now." | PDP below price (when product ≥ 1000 EGP), checkout payment section |

### The Trust Line (P9)

A dedicated one-line trust bar placed immediately below every primary CTA:

```
ضمان سنتين · شحن مجاني · ادفع لما الطلب يوصل
```

This is the P9 Wilson pattern — `TrustLine` component. It appears under every "أضيفي للسلة" button. It is a sales element with a consistent visual form.

Design of the trust line:
- Small text (body-sm), `--ink-muted` color
- Centered
- Three bullet-separated items, never more than three at once
- A small icon before each item (shield for warranty, truck for shipping, hand-and-coin for COD)
- No color emphasis — reads as reassurance, not advertising

### Required Trust Signal Placement

| Location | Required trust signals |
|----------|----------------------|
| Product card (catalog) | Warranty years visible |
| PDP — below price | COD, free shipping, installment hint (if ≥ 1000 EGP) |
| PDP — CTA action bar | Trust line (P9) below the add-to-cart button |
| Cart drawer | COD reminder at cart summary, free shipping confirmation |
| Checkout — order summary | COD, free shipping, total with no extra fees |
| Checkout — payment section | Kashier logos + COD prominently, installment options |
| Order confirmation page | COD inspection reminder ("افحصي الطلب لما يوصل قبل ما تدفعي") |

If a redesign removes a trust signal from any of these locations, removal needs explicit justification. Default: keep them.

---

## 3. Site Structure and Routes

### Public (no auth required)

| Route | Page |
|-------|------|
| `/` | Home — hero, featured products, categories, trust strip |
| `/products` | Catalog — grid, filters, search |
| `/products/:slug` | Product Detail — gallery, specs, add to cart, WhatsApp CTA |
| `/cart` | Cart — items, summary, checkout CTA |
| `/checkout` | Checkout — 3-step flow (single-page progressive) |
| `/contact` | Contact — phone, WhatsApp, email, FAQ |

### Authenticated (phone + JWT)

| Route | Page |
|-------|------|
| `/account` | Account — phone, name, saved addresses |
| `/orders` | My Orders — order list with status + tracking |
| `/orders/:id` | Order Detail — line items, payment, Bosta tracking link |
| `/service/new` | New Service Request — maintenance/replacement/return form |
| `/service` | My Tickets — ticket list with state badges |
| `/service/:id` | Ticket Detail — state machine display, notes, timeline |
| `/login` | Login — phone entry → OTP or password |

---

## 4. Home Page Layout

```
┌────────────────────────────────────────────────────────┐
│ HEADER: Logo | nav | cart icon | account | theme       │
├────────────────────────────────────────────────────────┤
│ HERO SECTION                                           │
│ Headline + subline (Arabic, Cairo Bold)                │
│ [تسوق الآن] [تتبع طلبك]                               │
│ Product image carousel (3 featured, auto-cycle 20s)   │
├────────────────────────────────────────────────────────┤
│ TRUST STRIP                                            │
│ ✓ شحن سريع  ✓ ضمان سنتين  ✓ خدمة عملاء              │
├────────────────────────────────────────────────────────┤
│ CATEGORIES GRID                                        │
│ مكواه | مكنسة | قلاية | خلاط | فرن | عجانة          │
├────────────────────────────────────────────────────────┤
│ FEATURED PRODUCTS                                      │
│ 4-col desktop / 2-col mobile responsive grid           │
│ Data: GET /api/products?featured=true&limit=8          │
├────────────────────────────────────────────────────────┤
│ SERVICE SECTION                                        │
│ ضمان | صيانة | استبدال | مرتجع — 4 CTAs              │
├────────────────────────────────────────────────────────┤
│ FOOTER: links | social | contact | rights              │
└────────────────────────────────────────────────────────┘
```

---

## 5. Product Card

**Used in:** catalog grid, featured products grid, search results, related products

Every product card contains:
- Product image (primary variant, WebP, lazy-load)
- Name (Arabic, Cairo, 2 lines max with ellipsis)
- Price in EGP (Inter tabular-nums)
- Old price + discount badge (if applicable, strikethrough + red badge)
- "شحن مجاني" badge (if applicable)
- Warranty line (years, always visible)
- Quick add-to-cart button (minimum 44px touch target)
- Low stock indicator — only shown when qty ≤ 3: "٢ قطعة متبقية" (amber text)

Product card grid: 4-col desktop, 2-col mobile, skeleton loading while fetching.

---

## 6. Product Detail Page (PDP)

The PDP is the most critical conversion page. Every element placement is a deliberate decision.

### Above the Fold (mobile — 390px width)

```
[Product image gallery — full width, swipeable]
[Product name — Cairo Bold, 2 lines max]
[Price — Inter tabular, large]
[Old price strikethrough + discount badge if applicable]
[Installment hint — if ≥ 1000 EGP]
[CtaActionBar — qty − + · أضيفي للسلة · WhatsApp]
[Trust line — ضمان · شحن مجاني · ادفع لما الطلب يوصل]
```

The above-fold must contain the decision elements. A user who does not scroll should have enough information to act.

### Below the Fold (section order is non-negotiable)

```
[Product description — warm authority copy, benefit-led]
[Technical specifications — table, key specs only]
[Warranty detail — what it covers, how to claim]
[Chef endorsement section — when applicable]
[Related products — 4 cards max, horizontally scrollable on mobile]
```

### Image Gallery

- Swipeable on mobile — finger-driven
- Dot indicators below for positional awareness
- Main image occupies 80% of viewport height on mobile
- Thumbnails below main image on desktop; swipeable strip on mobile
- Auto-cycle on desktop at 20s interval (P8 pattern) — paused on user interaction and on `prefers-reduced-motion`
- WebP format, lazy-load for images below fold

### Variant Selector

If a product has variations (color, size, configuration):
- Visual selectors (color swatches or labeled buttons) — never a dropdown
- Unavailable variants shown as disabled with strikethrough — user understands what exists
- Selected variant updates price and stock status in real time — no page reload
- Stock re-check happens at checkout time, not at add-to-cart (variants can have independent qty per location)

### CtaActionBar (P11)

The sticky control bar. On mobile, also the StickyMobileCta pinned to the bottom.

```
[−]  [quantity]  [+]     [أضيفي للسلة]    [اطلب عبر واتساب]
```

- Quantity stepper: 44px tap targets each side
- Add to cart: Hvar brand-primary color, full available width on mobile minus the stepper
- WhatsApp: secondary button — for buyers who want to discuss before buying
- On add to cart success: CartFAB badge animates (count increments with scale bump), CtaActionBar stays visible for adding more
- On stock depletion: button becomes "أبلغيني لما يتوفر" — not disabled with no forward path

### StickyMobileCta

Appears after the user scrolls past the first CTA:
- Price visible at all times
- Same add-to-cart + WhatsApp options as CtaActionBar
- Respects `env(safe-area-inset-bottom)` (iPhone notch)
- Hidden when the cart drawer is open
- Does not overlap content by more than 72px at the bottom

### API: Product Detail

```
GET /api/products/:slug
→ Returns: all variations + stock per variation+location
```

If product has variations: selecting a variant triggers a stock re-check for that specific `variation_id + location_id` combination. Displayed quantity is live.

---

## 7. Cart Patterns

### CartFAB (P12)

Fixed-position circular button, bottom corner (RTL: bottom-left, logical inset). Always visible when cart has items.

- Badge count showing number of items (not number of product types — total quantity)
- Count badge: white text on brand-primary background
- On cart update: badge animates with scale bump (scale 1.2 → 1, 200ms Wilson curve)
- No price on the FAB — it is a navigation element
- `env(safe-area-inset-bottom)` and logical inset respected for notched phones
- Appears only when cart has ≥ 1 item

### CartDrawer

Slide-in from the start edge (RTL: from right). Not a full page. Never a full-viewport modal.

Opening: slide in with P5 3D door-swing effect, Wilson curve easing.

```
[Drawer header: "سلتك" + close button]
[Cart item list]
  Each item: image + product name + qty stepper + price + remove ×
[Cart summary]
  Subtotal
  Shipping: مجاني (always, no threshold needed)
  Total
[Trust signals: COD reminder, warranty line]
[CTA: "إتمام الطلب" — full width, brand-primary]
[Secondary: "استمري في التسوق" — text link]
```

Cart item quantity update: inline — the stepper updates without closing the drawer. Immediate feedback with count animation.

Empty cart state: "سلتك فاضية — استعرضي المنتجات" with a browse button. Not "No items in cart."

Cart persistence: `localStorage`. Survives page refresh. Anonymous browsing keeps the cart. Cleared on order completion only.

### COD vs. Card in Cart

Cart summary always shows COD as the default expectation. "ادفع لما الطلب يوصل" next to the total. The payment method selection happens in checkout, not in the cart.

---

## 8. Checkout Flow

### Progressive Single-Page on Mobile

A multi-step wizard with separate pages creates navigation overhead and loses context. Progressive single-page: each section expands as the previous is completed. Completed steps collapse to a summary row. The user can re-open any completed section to edit. This keeps the user in one document.

The 3-step flow is implemented as React state machine — NOT multiple pages/routes. The URL stays at `/checkout` throughout.

### Step 1 — Contact

```
رقم الهاتف: *
[ 01X XXXX XXXX ]          ← dir="ltr", +20 prefix shown but not part of input

If phone number is new:
  → Name field appears
  → OTP or password flow

If phone is recognized (logged in):
  → Pre-filled, locked, "مش أنتِ؟" link to change
```

Phone validation on blur. Normalize to `01XXXXXXXXX` (Egyptian standard, 11 digits). Reject any non-`01[0125]` prefix with specific error: "رقم الموبايل المصري لازم يبدأ بـ 01 و يكون ١١ رقم."

### Step 2 — Delivery

Three paths for address collection:

**Path A — Geolocation:**
- "استخدمي موقعك الحالي" button
- Browser geolocation → reverse geocode → match to governorate + district in ERP DB
- Map pin confirmation: "هل ده العنوان الصح؟"
- Auto-fill governorate + district dropdowns + free-text street field

**Path B — Manual Dropdowns:**
- Governorate dropdown: from `cities` table (these are governorates — 27 Egyptian محافظات)
- District dropdown: populated after governorate selection from `districts WHERE city_id = ?`
- Street/apartment field: free text, required
- Building name / landmark: free text, optional but encouraged for delivery

**Path C — Saved Address (logged-in users):**
- Show saved address cards
- "اختاري عنوان محفوظ" or "أضيفي عنوان جديد"

**Why no free-text city entry:** "Maadi," "المعادى," "Ma'adi," and "معادي" are the same district. The dropdown constrained to the ERP's `districts` table ensures the address matches Bosta's field expectations and the ERP webhook format. The dropdowns must use exactly the `cities.name` and `districts.district_name` values from the DB — this maximizes the chance of a clean ERP match.

Delivery date note: "التسليم خلال ١-٣ أيام عمل" shown non-interactively below the address fields.

```
API calls:
GET /api/locations/governorates → cities table (id, name Arabic)
GET /api/locations/districts?governorate_id=:id → districts by governorate
```

### Step 3 — Payment

```
○  الدفع عند الاستلام (COD)   ← default, visually primary
   ادفع لما الطلب يوصل — بدون أي رسوم إضافية

○  بطاقة / محافظ / تقسيط (Kashier)
   [Visa] [Mastercard] [ValU] [Souhoola] [Aman]

[تأكيد الطلب]
```

When Kashier selected: show total and redirect notice ("هتنتقلي لصفحة الدفع الآمنة من كاشير"). Never surprise the user with a redirect.

**The Kashier HPP UX flow:**
1. User selects card → clicks "تأكيد الطلب"
2. Backend creates pending_payment record + generates HPP URL + validates HMAC
3. Backend triggers: stock re-check `FOR UPDATE` (server-side, atomic)
4. Redirect to Kashier HPP
5. Kashier redirects back → backend validates `x-kashier-signature`
6. On SUCCESS: order created, redirect to `/orders/:id`
7. On user abandonment (returns without completing Kashier): show "استأنفي الدفع" option or offer COD instead

**On "تأكيد الطلب" (any payment method):**
1. Stock re-check server-side with `SELECT ... FOR UPDATE` — never rely on stock level shown during browsing
2. If stock conflict: surface it inline (see Error States section), do not crash checkout
3. Create order in `orders` table
4. COD: redirect to `/orders/:id` (order confirmation)
5. Kashier: generate HPP URL → redirect → callback → confirm → redirect

### Order Summary

Visible at all times during checkout:
- Desktop: fixed right column
- Mobile: sticky collapsible bar at top ("سلتك — X منتجات — X,XXX جنيه" expands to full line-item list)

Never hide the order summary behind a "view order" button. The buyer must see what they are buying without extra steps.

---

## 9. Order Confirmation and Tracking

**URL:** `/orders/:id`

```
┌──────────────────────────────────────────────────┐
│  ✓ تم استلام طلبك                                │
│  رقم الطلب: HVAR-20240601-0042                   │
│                                                  │
│  ITEMS                                           │
│  مكواة برافيا × ١ .... ١٢٠٠ جنيه                │
│                                                  │
│  DELIVERY ADDRESS                                │
│  القاهرة، مدينة نصر، شارع ١٥                    │
│                                                  │
│  PAYMENT                                         │
│  الدفع عند الاستلام                               │
│                                                  │
│  COD REMINDER                                    │
│  "افحصي الطلب لما يوصل قبل ما تدفعي"             │
│                                                  │
│  TRACKING (appears after MCRM confirms)         │
│  ┌──────────────────────────────────┐            │
│  │ تتبع شحنتك → [رابط Bosta]        │            │
│  │ رقم التتبع: 28473647              │            │
│  └──────────────────────────────────┘            │
└──────────────────────────────────────────────────┘
```

Tracking section appears after `transactions.bill_code` is populated (by MCRM/ERP after the draft is confirmed and Bosta shipment is created). While `bill_code` is null: show a neutral "جاري تجهيز طلبك" state with a polite note that tracking info will appear here.

**API:** `GET /api/orders/:id` → returns order data + `bill_code` (may be null until MCRM confirms)

The order list at `/orders` shows all orders with delivery status badges and quick access to the detail page.

---

## 10. Service Request Portal

The service portal is the feature that separates hvarstore.com from a basic storefront. Every product that Hvar sells carries an after-sales lifecycle — the portal is where that lifecycle becomes visible to the customer.

### The Three Ticket Types (Customer-Facing)

| MCRM Code | Arabic | Customer Use Case |
|-----------|--------|------------------|
| HVM | صيانة | Product stopped working or malfunctioning — needs repair |
| HVR | استبدال | Product is defective — needs replacement under warranty |
| HVT | مرتجع | Customer wants to return the product |

HVS (Sell) is internal. Never surface it to customers.

### New Service Request Form — `/service/new`

**Step 1 — اختر نوع الطلب**

Three large selection cards:

```
┌────────────────────┐  ┌────────────────────┐
│   صيانة            │  │   استبدال           │
│   المنتج لا يعمل   │  │   منتج معيب         │
│   بشكل صحيح        │  │   يحتاج استبدال     │
└────────────────────┘  └────────────────────┘
┌────────────────────┐
│   مرتجع             │
│   أريد إرجاع        │
│   المنتج            │
└────────────────────┘
```

Cards use SVG icons, not emoji. Card text uses `body` typography. Selected card gets primary border + soft background fill. The user taps once to select — no confirmation button needed before moving to Step 2.

**Step 2 — تفاصيل المشكلة**

Product identification — three paths in order of preference:

- Path A: "من طلباتي السابقة" — dropdown/search of the customer's order history. Pre-fills product name and optionally sets `transaction_id` on the ticket.
- Path B: Manual product name entry — for gifts, cash purchases, old orders not in the system.
- Path C: "مش عارف رقم الطلب" → WhatsApp pre-filled with "مرحباً، أريد فتح طلب صيانة لمنتج [اسم المنتج]" — better than blocking the user.

Issue description field:
- Prompt: "اوصفي المشكلة بالتفصيل — ده بيساعدنا نخدمك أسرع"
- Minimum 20 characters (Arabic)
- Character count shown while typing
- Photos: optional upload, up to 3 images

**Step 3 — بيانات التواصل والاستلام**

```
رقم الهاتف: *
[ 01X XXXX XXXX ]                ← pre-filled and locked if logged in

عنوان الاستلام: *
[محافظة ▼] [مدينة ▼]
[العنوان التفصيلي...]

تاريخ مناسب للاستلام (اختياري):
[__/__/____]

[إرسال الطلب]
```

On submit: `POST /api/tickets`

```json
{
  "type": "HVM",
  "status": "PENDING",
  "contact_id": 123,
  "transaction_id": null,
  "product_id": 45,
  "notes": "يصدر صوت غريب عند التشغيل"
}
```

If customer selected from their previous orders: `transaction_id` is populated. MCRM agents see the full purchase history when working the ticket.

After submission: "تم استلام طلبك" confirmation screen with ticket reference number and expected first-contact timeframe.

### Ticket List — `/service`

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
└────────────────────────────────────────────────────────┘
```

**API:** `GET /api/tickets?type=HVM&status=:status&page=1`

### Ticket Detail — `/service/:id`

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
│  الوقت المتوقع: ٥ يونيو ٢٠٢٤ (تقريبي)                   │
│                                                          │
│  ملاحظات من الفريق: (shown only if MCRM added notes)    │
│                                                          │
│  [تواصل معنا عبر واتساب]  [عودة لطلباتي]                │
└──────────────────────────────────────────────────────────┘
```

**API:** `GET /api/tickets/:id` → reads `service_tickets` + history. If `service_ticket_history` table exists: use it for timestamps per state transition. If not: derive timeline from `created_at`, `updated_at`, and current `status`.

**DB query:**
```sql
SELECT st.*, c.name as customer_name, p.name as product_name,
       t.website_order_id as order_ref
FROM service_tickets st
LEFT JOIN contacts c ON c.id = st.contact_id
LEFT JOIN products p ON p.id = st.product_id
LEFT JOIN transactions t ON t.id = st.transaction_id
WHERE st.id = :id AND st.contact_id = :current_customer_id
```

### State Machines (Customer-Visible)

**صيانة (HVM) — Maintenance:**

```
PENDING → HUB_RECEIVED → IN_WORKSHOP → READY → CLOSED
CANCELLED (terminal)
FAILED (terminal)
```

| State | Customer-Facing Arabic | Expected Wait |
|-------|----------------------|--------------|
| PENDING | طلبك قيد المعالجة، سيتواصل معك فريقنا | ساعات |
| HUB_RECEIVED | وصل منتجك لمركز الخدمة، بدأنا التشخيص | ١ يوم عمل |
| IN_WORKSHOP | منتجك قيد الإصلاح الآن | ٢-٤ أيام عمل |
| READY | منتجك جاهز للاستلام أو الشحن | — |
| CLOSED | تم إغلاق الطلب بنجاح | — |
| FAILED | تعذّر الإتمام — تواصلي معانا لمعرفة الخطوات التالية | — |

**استبدال (HVR) — Replacement:**

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

**مرتجع (HVT) — Return:**

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

### State-to-Color Mapping

| State | Arabic | Tailwind |
|-------|--------|---------|
| PENDING | قيد المعالجة | `text-slate-500 bg-slate-50` |
| HUB_RECEIVED | في المركز | `text-blue-600 bg-blue-50` |
| IN_WORKSHOP | قيد الإصلاح | `text-amber-600 bg-amber-50` |
| DISPATCHED | في الطريق | `text-purple-600 bg-purple-50` |
| INSPECTED | تم الفحص | `text-blue-600 bg-blue-50` |
| READY | جاهز | `text-green-600 bg-green-50` |
| REFUNDED | تم الرد | `text-green-600 bg-green-50` |
| CLOSED | مغلق | `text-emerald-600 bg-emerald-50` |
| CANCELLED | ملغي | `text-red-600 bg-red-50` |
| FAILED | تعذر | `text-red-600 bg-red-50` |

### ServiceStepper (P10)

Vertical timeline on mobile, horizontal on desktop. RTL-aware — line flows from right to left.

- Completed step: filled dot + Hvar brand-primary color + checkmark + timestamp
- Current step: pulsing dot, brand-primary, current time
- Future step: empty dot, `--ink-disabled` color, no timestamp
- Failed/cancelled terminal: red X

**State copy for non-technical users — never expose state codes:**

| State | Show | Never show |
|-------|------|-----------|
| PENDING | "في الانتظار — هنتواصل معاكِ قريبًا عشان نرتب الاستلام" | "PENDING" |
| HUB_RECEIVED | "وصل المركز — جاري الفحص والتقييم" | "HUB_RECEIVED" |
| IN_WORKSHOP | "في الورشة — الجهاز بيتصلح" | "IN_WORKSHOP" |
| READY | "جاهز — هنتواصل معاكِ لمواعيد التوصيل" | "READY" |
| CLOSED | "تم الإغلاق — شكرًا لتعاملك مع هفار" | "CLOSED" |
| CANCELLED | "تم الإلغاء" | "CANCELLED" |
| FAILED | "تعذّر الإتمام — تواصلي معانا لمعرفة الخطوات التالية" | "FAILED" |

---

## 11. WhatsApp Integration

WhatsApp is the primary support and sales channel. Every service-related page shows a WhatsApp CTA.

**Number:** 01204444196 → `https://wa.me/201204444196?text={encodeURIComponent(message)}`

**Pre-filled message by context:**

| Context | Pre-filled Arabic message |
|---------|--------------------------|
| Order tracking | "مرحباً، أريد الاستفسار عن طلبي رقم HVAR-20240601-0042" |
| New maintenance request | "مرحباً، أريد فتح طلب صيانة لمنتج [اسم المنتج]" |
| PDP (product discussion) | "مرحباً، أريد الاستفسار عن [اسم المنتج]" |
| General | "مرحباً، أريد الاستفسار" |

**WhatsApp FAB placement:** always visible at bottom-left (RTL logical start) across the entire site. The WhatsApp FAB and CartFAB occupy different corners and must not overlap.

---

## 12. Frontend Provider Hierarchy

```jsx
<ThemeProvider>
  <AuthProvider>
    <CartProvider>
      <Router>
        <Layout>
          <Header />
          <Suspense fallback={<PageLoading />}>
            <Routes>
              {/* Public routes */}
              {/* Auth routes */}
              {/* Protected routes */}
            </Routes>
          </Suspense>
          <Footer />
          <CartDrawer />          {/* Slide-out, always mounted */}
          <WhatsAppFAB />         {/* Always visible */}
        </Layout>
      </Router>
    </CartProvider>
  </AuthProvider>
</ThemeProvider>
```

---

## 13. Component Reference

| Component | Purpose |
|-----------|---------|
| `ProductCard` | Image, name, price, discount badge, add-to-cart |
| `ProductGrid` | 4-col responsive grid with skeleton loading |
| `CartDrawer` | Slide-over drawer, cart contents |
| `CheckoutSteps` | 3-step progress indicator (React state machine) |
| `GovernorateSelect` | Searchable governorate dropdown (from cities table) |
| `DistrictSelect` | Dependent district dropdown |
| `PhoneInput` | Egyptian phone with +20 prefix, normalize on blur |
| `OrderCard` | Order summary with status badge + tracking link |
| `TicketTimeline` | Vertical state machine stepper display |
| `KashierRedirect` | HPP URL generation + redirect |
| `PaymentMethodSelector` | COD vs Kashier toggle |
| `ServiceRequestForm` | 3-step ticket creation form |
| `StatusBadge` | Arabic status pill |
| `TrackingLink` | Bosta tracking number + external link |
| `TrustLine` | P9 trust strip below CTAs |
| `WhatsAppFAB` | Floating WhatsApp button |
| `CartFAB` | P12 floating cart button with badge |
| `StickyMobileCta` | PDP bottom bar for mobile |

---

## 14. Empty States

Every list has an empty state. Empty states are navigation moments — tell the user what to do next, not just that the list is empty.

| Page | Empty condition | Arabic copy | CTA |
|------|----------------|-------------|-----|
| Catalog | No products in category | "مفيش منتجات في هذه الفئة لحد دلوقتي" | Browse other categories |
| Search results | No products match | "مفيش نتايج لـ '[query]'" | Clear search or suggest categories |
| Orders list | No orders placed | "مفيش طلبات لحد دلوقتي" | "تسوقي دلوقتي" → products |
| Tickets list | No tickets opened | "مفيش تذاكر خدمة لحد دلوقتي. لو عندك منتج محتاج صيانة أو استبدال، ابدئي هنا." | "افتحي تذكرة" → ticket form |
| Cart drawer | Cart is empty | "سلتك فاضية" | "استعرضي المنتجات" |
| Saved addresses | No addresses | "مفيش عناوين محفوظة" | "أضيفي عنوان جديد" |

Empty state design:
- Simple illustration or icon (no stock images)
- Warm authority voice — matter-of-fact, not apologetic, not cute
- Single CTA — not multiple options

---

## 15. Error States

### Form Validation Errors

- Inline, adjacent to the field that caused the error
- Arabic, specific: "رقم الموبايل المصري لازم يبدأ بـ 01 ويكون ١١ رقم" — not "رقم غير صالح"
- Red text with small icon, visually associated with the field
- Not a modal. Not a toast. Inline only.
- Error clears on input change; re-validates on blur

### API / Network Errors

| Error type | What to show |
|-----------|-------------|
| Network timeout | "في مشكلة في الاتصال — تأكدي من النت وجربي تاني" + retry button |
| Stock conflict at checkout | Inline: "عدد القطع المتاحة أقل مما اخترتِ. غيّري الكمية للمتاح وأتمي الطلب." + available qty shown |
| Payment failure (Kashier) | "الدفع لم يتم — تأكدي من بيانات البطاقة أو اختاري طريقة دفع مختلفة" + options to retry or switch to COD |
| Session expired | "انتهت جلستك — سجلي دخولك تاني" — cart survives (localStorage) |
| Server error | "في مشكلة مؤقتة — جربي تاني بعد قليل" + WhatsApp contact option |

Never: raw error codes visible to customers. Never: "Error 500." Never: blank white page. Never: clear the cart as a side effect of an error.

### Stock Depleted on Checkout

Specific handling — one of the most frustrating moments in the buyer journey:
1. Do not crash the checkout flow
2. Show: "عدد القطع المتاحة أقل — في [N] قطعة فقط متاحة"
3. Offer: [Update quantity to N] or [Remove item] or [Contact via WhatsApp about availability]
4. Never show a generic error and clear the cart

---

## 16. Mobile-First Rules

### Touch Targets

44px minimum in both dimensions. Every interactive element: buttons, links, checkboxes, radio buttons, quantity steppers, close buttons, select dropdowns. If a visual element needs to be smaller, add invisible padding to reach 44px.

### Bottom-Heavy Navigation

The thumb zone on a smartphone is the bottom third. Critical actions live there:
- CartFAB: fixed bottom corner
- WhatsApp FAB: fixed bottom corner (opposite side)
- StickyMobileCta: fixed bottom bar on PDP
- Cart drawer CTA: bottom of drawer
- Primary checkout button: bottom of each section

Top navigation (Navbar) is for orientation, not primary action. The user must be able to complete the most common actions (add to cart, checkout, view cart) without reaching to the top of the screen.

### Safe Area Insets

For iPhone models with notch/home bar (significant portion of Egyptian iOS users):
- `env(safe-area-inset-bottom)` on all fixed bottom elements
- `env(safe-area-inset-top)` on sticky top elements
- CartFAB: `bottom: calc(1rem + env(safe-area-inset-bottom))`
- StickyMobileCta: `padding-bottom: env(safe-area-inset-bottom)`

### What Degrades on Mobile (Intentional)

| Feature | Desktop | Mobile |
|---------|---------|--------|
| Product card hover effects | Product card shine, overlay | Not shown (touch-first) |
| Order summary | Fixed right column | Sticky collapsible bar at top |
| Filter panel | Side panel | Collapsible bar, full-width when open |
| Table views | Full table | Card-based list |
| Horizontal product carousels | 4-col grid | 2-col grid or horizontal scroll |
| Image gallery thumbnails | Below main image, clickable | Swipeable strip below main image |
| Sidebar navigation (admin) | Fixed sidebar | Overlay, hamburger trigger |

### What Must Not Degrade

| Feature | Reason |
|---------|--------|
| Trust line below CTAs | Closing mechanic — always visible |
| WhatsApp FAB | Primary support channel |
| COD reminder in cart | Trust signal — always visible |
| Order summary during checkout | Buyer must always see what they are buying |
| Ticket timeline | Core post-sale feature |

### Swipe Gestures

- PDP image gallery: swipe left/right
- CartDrawer: swipe to close (toward leading edge)
- No custom swipe gestures that conflict with native vertical scroll

### No Hover-Only Interactions

Every hover interaction on desktop needs a mobile equivalent: always visible or triggered by tap. Product card hover effects that reveal information must make that information always visible on mobile.

---

## 17. RTL-Specific Patterns

### Layout Mirroring

The site is Arabic-first, RTL. The entire layout mirrors:

- Reading direction: right to left
- Navigation: flows from right
- Cart drawer: slides in from the right (start edge in RTL)
- WhatsApp FAB: bottom-left (start-bottom in RTL = right physically... use logical: `inset-inline-start`)
- CartFAB: bottom-right (end-bottom in RTL = left physically... use logical: `inset-inline-end`)
- Stepper progress: right to left
- Icons that carry directional meaning (arrows, chevrons) must be mirrored

### Logical CSS Properties

Use logical properties throughout. Never hardcode `left` or `right` for positioning, padding, or margin:

```css
/* Wrong */
padding-left: 12px;
margin-right: auto;
position: absolute; left: 0;

/* Correct */
padding-inline-start: 12px;
margin-inline-end: auto;
position: absolute; inset-inline-start: 0;
```

Tailwind RTL-aware utilities:
- `ps-` (padding-start), `pe-` (padding-end)
- `ms-` (margin-start), `me-` (margin-end)
- `start-` / `end-` for positioning
- `text-start` for text alignment

### Mixed Content (Arabic + Prices)

Prices and numbers in an Arabic context require careful handling:

```
The sentence is RTL: "السعر: ١٢٠٠ جنيه"
The number itself reads LTR: 1200

Do NOT wrap numbers in dir="ltr" elements inline within Arabic text.
Arabic numerals (٠١٢٣٤٥٦٧٨٩) render correctly in RTL context.
Western numerals (0123456789) with tabular-nums also render correctly in RTL.

Kashier logos, Visa/Mastercard logos, and partner brand names stay LTR
within RTL context — wrap in a dir="ltr" span:
  <span dir="ltr">ValU</span>
```

Price display rule:
- Use Inter font with `font-variant-numeric: tabular-nums` for all prices
- Arabic price label ("السعر:", "الإجمالي:") precedes the number in RTL flow
- Currency suffix "جنيه" or "ج.م" follows the number: "١٢٠٠ ج.م"

### Phone Fields

Phone numbers always display LTR regardless of page direction:
```html
<input type="tel" dir="ltr" />
```

The +20 prefix is shown to signal Egyptian context but not included in the input value. Normalize on blur.

### Icon Direction

Icons with directional meaning mirror in RTL:
- ArrowRight → should point right in LTR, left in RTL (toward forward/next)
- ArrowLeft → should point left in LTR, right in RTL (toward back/previous)
- ChevronRight → mirrors to ChevronLeft in RTL for "expand" semantics

Icons without directional meaning (magnifying glass, heart, cart, shield) do not mirror.

### Date and Time Display

Use Arabic-Indic numerals for dates displayed in Arabic context where appropriate:
- Order date: "١ يونيو ٢٠٢٤"
- Ticket timeline timestamps: "٠٩:٠٠"
- If mixing with Western numerals, be consistent per context

### Arabic Number & Value Formatting

Money and quantities render in **Arabic-Indic numerals** (٠١٢٣٤٥٦٧٨٩) with the **Arabic separators** — not the Western `,` and `.`:

- Thousands separator: **٬** (U+066C, Arabic Thousands Separator)
- Decimal separator: **٫** (U+066B, Arabic Decimal Separator)

These are distinct from the Latin comma/period. `formatCurrency(1991.26)` is `١٬٩٩١٫٢٦ ج.م` — note the ٬ between thousands and the ٫ before the fraction.

| Function | Input | Output |
|----------|-------|--------|
| `formatCurrency` | `1991.26` | `١٬٩٩١٫٢٦ ج.م` |
| `formatNumber` | `1234` | `١٬٢٣٤` |
| `formatRelativeTime` | `(3h ago)` | `منذ ٣ ساعات` |
| `formatTrackingNumber` | `ABC123DEF456` | `ABCD-123D-EF45` (4-char groups) |
| `formatPhone` | `01234567890` | `012 3456 7890` |
| `formatDuration` | `3661` | `1 ساعة 1 دقيقة` |

**Rules:**
- **Money and quantities** → Arabic-Indic digits + Arabic thousands (٬) and decimal (٫) separators. Currency suffix `ج.م` follows the number (RTL flow): `١٬٩٩١٫٢٦ ج.م`.
- **Tracking numbers** group in **4-character blocks** joined by `-` (`ABCD-123D-EF45`). These are alphanumeric codes, kept LTR — do not Arabic-ize the letters/digits inside a tracking code (it must match the Bosta `bill_code`).
- **Phone numbers** group as `012 3456 7890` (3-4-4) and stay LTR (`dir="ltr"`), consistent with the Phone Fields rule above.
- **Relative time and durations** render the numeric part in Arabic-Indic digits with Arabic unit words (`منذ ٣ ساعات`, `1 ساعة 1 دقيقة`).
- This formatting layer pairs with the price-display rule (Inter + `tabular-nums`): the font handles fixed-width digits, these functions handle the digit script and separators. Apply formatters at the display boundary, never store Arabic-Indic digits in the DB.

---

## 18. Loading States

### Skeleton Screens

Product lists, order lists, and ticket lists use skeleton screens — placeholder elements shaped like the content with a shimmer animation.

The skeleton must be exact dimensions of the content that will load — not a generic placeholder. This reduces layout shift when content arrives.

```
Product card skeleton: gray rectangle for image (fixed aspect ratio)
                       two gray bars for name and price
Repeated for the grid layout
```

### Point-Action Spinners

Spinners appear only for user-triggered point actions:
- Add to cart button: spinner inside button while processing
- Checkout submit: spinner inside button, button disabled during processing
- Ticket submit: same pattern

Never: full-viewport overlay spinner blocking all interaction. If action takes more than 2 seconds, show progress feedback while keeping the rest of the page interactive.

### Optimistic Updates

Cart: update CartFAB badge count immediately when "add to cart" is clicked, before action completes. Roll back on failure. Interaction feels instantaneous.

Cart quantity stepper: update displayed quantity immediately, then sync. Do not wait for store update before showing new number.

---

## 19. Accessibility

### Focus Management

- Focus ring: 2px solid brand-primary
- Focus offset: 2px
- Focus trapped within modals when open
- On modal close: focus returns to the element that opened it

### ARIA

```jsx
<button aria-label="إغلاق السلة">×</button>
<nav aria-label="التصفح الرئيسي">...</nav>
<main aria-label="صفحة المنتج">...</main>
<div role="status" aria-live="polite">{cartUpdatedMessage}</div>
```

Dynamic content updates (cart count, ticket status changes) announced via `aria-live="polite"`.

### Contrast

All text meets WCAG AA contrast ratios:
- Body text on white: ≥ 4.5:1
- Large text on white: ≥ 3:1
- Status badges: text color + background chosen to meet AA

### Semantic HTML

- `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`
- Table headers with `scope="col"` / `scope="row"`
- Form elements with associated `<label>` (not just placeholder)
- Ticket timeline implemented as `<ol>` with `<li>` per step

---

## 20. Animation and Motion

### Wilson Curve

All interactive animations use the Wilson easing curve (cubic-bezier defined in design system). This is not a generic `ease-in-out` — it is the project-specific motion signature.

### Durations

| Speed | Duration | Use Case |
|-------|----------|----------|
| Fast | 150ms | Button hover, focus states, badge count updates |
| Normal | 250ms | CartDrawer open/close, modal appear |
| Slow | 350ms | Page transitions, stepper state changes |

### `prefers-reduced-motion`

All auto-cycling animations (hero carousel, product image cycle) and decorative transitions respect:
```css
@media (prefers-reduced-motion: reduce) {
  .animate-auto { animation: none; }
  .transition-all { transition: none; }
}
```

Functional animations (cart drawer sliding, skeleton shimmer, add-to-cart feedback) may still run at reduced intensity — they communicate state, not decoration.

---

## 21. Scope: What This Site Does Not Do

| Excluded | Who handles it |
|----------|---------------|
| Admin panel | ERP + MCRM |
| Product management | Products come from ERP |
| Stock adjustment | ERP handles all stock |
| Bosta API direct calls | MCRM handles Bosta |
| Order confirmation calls | MCRM call center |
| Multi-currency | EGP only at launch |
| Multi-language (AR/EN switch) | Arabic RTL only at launch; English is future |
| POS terminal | Separate project |
| Seller management | Not applicable |

---

## 22. Backend API Reference (Site)

All under `/api/`. JWT required except marked public.

### Auth
```
POST  /api/auth/request-otp      → Send OTP to phone (public)
POST  /api/auth/verify-otp       → Verify OTP → JWT
POST  /api/auth/login            → Phone + password → JWT
GET   /api/auth/me               → Current customer profile
```

### Products (public)
```
GET   /api/products              → Paginated catalog (category, q, min_price, max_price)
GET   /api/products/:slug        → Product + all variations + stock
GET   /api/products/featured     → Featured products (limit 8)
GET   /api/categories            → Category list with counts
```

### Locations (public)
```
GET   /api/locations/governorates          → cities table (id, name Arabic)
GET   /api/locations/districts/:govId      → districts by governorate
```

### Orders
```
POST  /api/orders                → Create order (stock validation FOR UPDATE, ERP webhook)
GET   /api/orders                → Customer's order history
GET   /api/orders/:id            → Order detail + tracking (bill_code may be null)
```

### Payments
```
POST  /api/payments/kashier/initiate   → Generate HPP URL + store pending_payment
POST  /api/payments/kashier/callback   → Kashier callback (public — validates HMAC)
```

### Service Tickets
```
POST  /api/tickets               → Open new maintenance/replacement/return ticket
GET   /api/tickets               → Customer's ticket list
GET   /api/tickets/:id           → Ticket detail + state timeline
```

### Account
```
GET   /api/account               → Profile + addresses
PUT   /api/account               → Update name
POST  /api/account/addresses     → Add address
PUT   /api/account/addresses/:id → Update address
```
