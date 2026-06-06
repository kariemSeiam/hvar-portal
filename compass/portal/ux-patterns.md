# UX Patterns — hvarstore.com

> Interaction design direction for the customer portal. How things move, what users see when they act, and why. Design for the actual Egyptian buyer, not for an idealized user in a UX textbook.

---

## The Egyptian Buyer Journey

This is the real journey. Not the one that looks good in a journey map. The one that happens.

**Stage 1: Discovery via recipe content**
A woman is on Facebook or TikTok. A recipe video appears — Chef Sara making ملوخية, or a quick كنافة tutorial. The food is interesting. The appliance used produces a result she can imagine in her own kitchen. She shares the video to a WhatsApp group of friends or family: "شوفوا الوصفة دي." She does not visit hvarstore.com yet.

**Stage 2: Re-engagement days or weeks later**
Someone in the WhatsApp group asks "الجهاز ده من فين؟" A link is shared. Or she sees another Hvar video and this time decides to look. She navigates to hvarstore.com on her phone. She browses, not with intent to buy immediately. She is evaluating: is this brand real? Does it look legitimate? Can I trust it?

**Stage 3: Trust assessment on the PDP**
She reaches a product detail page. She reads: the price, the warranty, whether shipping is free, whether she can pay on delivery. She reads customer reviews if available. She may look up the brand name on Facebook to see if there is an active community, real comments, real people. Trust is not built on the page alone — it is built across the brand's total presence.

**Stage 4: The pre-purchase call (the trust check)**
For many Egyptian buyers, especially for first purchases above a certain price point: she contacts via WhatsApp before completing the order. "إيه الفرق بين المنتج ده والتاني؟" or "الضمان بيتعمل إزاي؟" The WhatsApp channel is not just a support channel — it is a sales channel. The buyer who calls has already decided they might buy; they need one more confirmation.

**Stage 5: Cart and checkout**
She adds to cart. On mobile, this should feel like a confident forward motion — not like a set of obstacles. She selects COD. She enters her address (many will use the geolocation shortcut if offered clearly). She reviews the order summary and confirms.

**Stage 6: Post-order**
She tracks her order. When it arrives, she inspects before paying — this is the COD promise, and it must be honored. After delivery, she may share her experience in the WhatsApp group. This is the loop: customer → community → next customer.

**Design implications of this journey:**

- Trust signals are not marketing copy. They are closing mechanics placed at every hesitation point.
- The WhatsApp contact option must be always accessible — at the PDP, in the cart, on the checkout page. Some buyers need this to complete.
- The checkout must not feel like a form barrier — it should feel like a natural forward motion.
- Post-purchase communication is part of the product. Order confirmation + delivery update + COD inspection moment = the full experience.
- The buyer may return from mobile, share a link from desktop, and complete on mobile. Multi-device journeys are the norm.

---

## Trust Architecture

Trust signals in hvarstore.com are not decorative. They are closing mechanics placed at specific hesitation points in the journey. A trust signal in the wrong place does nothing. A trust signal missing at the right moment loses the sale.

### The Four Trust Pillars

| Trust Element | What it says psychologically | Where it must appear |
|--------------|------------------------------|---------------------|
| **COD — ادفع لما الطلب يوصل** | "We trust you. You don't risk anything." | PDP below price, cart summary, checkout step 1, cart drawer |
| **Warranty (2–3 years)** | "This product is built to last. We stake money on it." | PDP product info section, product card (on hover or always visible), post-checkout confirmation |
| **Free shipping — شحن مجاني** | "No hidden cost. The price you see is the price you pay." | PDP below price, cart summary, checkout |
| **Installments — ValU/Souhoola/Aman** | "You don't have to pay everything now." | PDP below price (when product ≥ 1000 EGP), checkout payment section |

### The Trust Line (P9)

A dedicated one-line trust bar placed immediately below every primary CTA:

```
ضمان سنتين · شحن مجاني · ادفع لما الطلب يوصل
```

This is the P9 Wilson pattern — `TrustLine` component. It appears under every "أضيفي للسلة" button. It is not a design element. It is a sales element with a consistent visual form.

**Design of the trust line:**
- Small text (text-sm), `--ink-muted` color
- Centered
- Three bullet-separated items, never more than three at once
- A small icon before each item (shield for warranty, truck for shipping, hand-and-coin for COD)
- No color emphasis — it should read as reassurance, not advertising

### Where Trust Signals Must Appear (Required)

| Location in the UI | Required trust signals |
|-------------------|----------------------|
| Product card (catalog) | Warranty years visible (at minimum on hover, ideally always) |
| PDP — below price | COD, free shipping, installment hint (if ≥1000 EGP) |
| PDP — CTA action bar | Trust line (P9) below the add-to-cart button |
| Cart drawer | COD reminder at cart summary, free shipping confirmation if threshold met |
| Checkout — order summary | COD, free shipping, total including no extra fees |
| Checkout — payment section | Kashier logos + COD prominently, installment options |
| Order confirmation page | COD inspection reminder ("افحصي الطلب لما يوصل قبل ما تدفعي") |

If a redesign removes a trust signal from any of these locations, the removal needs explicit justification. The default is: keep them.

---

## The Product Detail Page (PDP)

The PDP is the most critical conversion page. Every element placement is a deliberate decision.

### Above the Fold (Mobile — 390px width)

```
[Product image gallery — full width, swipeable]
[Product name — Cairo Bold, 2 lines max]
[Price — Inter tabular, large]
[Installment hint — brass text, small (if ≥1000 EGP)]
[CtaActionBar — qty − + · أضيفي للسلة · WhatsApp]
[Trust line — ضمان · شحن مجاني · ادفع لما الطلب يوصل]
```

The above-fold must contain the decision elements. A user who does not scroll should have enough information to decide to add to cart or continue scrolling for detail.

### Below the Fold

```
[Product description — warm authority copy, benefit-led]
[Technical specifications — table format, key specs only]
[Warranty detail — what it covers, how to claim]
[Chef uses this — endorsement section when applicable]
[Related products — 4 cards max, horizontally scrollable on mobile]
```

### Image Gallery (PDP)

- Swipeable on mobile — finger-driven, no pagination dots needed (the swipe gesture is universally understood)
- Dot indicators below for positional awareness
- Main image occupies 80% of viewport height on mobile — this is where the product is most fully experienced
- Thumbnails below the main image on desktop, swipeable strip on mobile
- Auto-cycle on desktop (P8 pattern, 20s interval) — paused on user interaction and on `prefers-reduced-motion`
- WebP format, lazy-load for images below fold

### Variant Selector

If a product has multiple variations (color, size, configuration):
- Show variant options as visual selectors (color swatches or labeled buttons), not a dropdown
- Currently unavailable variants are shown as disabled (strikethrough) so the user understands what exists even if not currently purchasable
- Selected variant updates the price and stock status in real time — no page reload

### CtaActionBar (P11)

The sticky control bar. On mobile, this is also the StickyMobileCta at the bottom of the screen.

```
[−]  [quantity]  [+]     [أضيفي للسلة]    [WhatsApp]
```

- Quantity stepper: tap targets 44px minimum each
- Add to cart: Hvar red, full available width on mobile (minus quantity stepper)
- WhatsApp: trust-green, secondary button — for buyers who want to discuss before buying
- On add to cart success: brief animation on CartFAB badge (count increments), the CtaActionBar does not disappear or transform — it stays for adding more quantity
- On stock depletion: add-to-cart button becomes "أبلغيني لما يتوفر" (or WhatsApp contact) — not disabled with no path forward

### StickyMobileCta

On mobile, a sticky bottom sheet that appears after the user scrolls past the first CTA:
- Price visible (so the buyer always knows what they're buying at)
- Same add-to-cart + WhatsApp options as CtaActionBar
- Respects safe-area-inset-bottom (iPhone notch)
- Dismissed (hidden) when the cart drawer is open
- Does not overlap content by more than 72px at the bottom

---

## Cart Patterns

### CartFAB (P12)

Fixed-position circular button, bottom-right corner (RTL: bottom-left, adjusted with logical inset). This is always visible when the cart has items.

- Badge count on the button showing number of items
- Count badge: white text on Hvar red background, always visible
- On cart update (add/remove): badge count animates with a brief scale bump (`transform: scale(1.2)` → `scale(1)`, 200ms Wilson curve)
- No price shown on the FAB — this was a deliberate design decision: the FAB is a navigation element, not a price display
- `safe-area-inset-bottom` and `safe-area-inset-right/left` respected for notched phones
- Does not appear until there is at least 1 item in the cart

### CartDrawer

A side drawer (right side in LTR, left side in RTL — from the start edge). Not a full page. Never a full-viewport modal that blocks the browsing context.

**Opening:** slide in from the start edge (RTL: from right) using the P5 3D door-swing effect, Wilson curve easing.

**Contents:**
```
[Drawer header: "سلتك" + close button]
[Cart item list]
  Each item: image + product name + qty stepper + price + remove
[Cart summary]
  Subtotal
  Shipping: مجاني (always)
  Total
[Trust signals: COD reminder, warranty line]
[CTA: "إتمام الطلب" — full width Hvar red]
[Secondary: "استمري في التسوق" — text link]
```

**Cart item quantity update:** inline — the stepper in the drawer updates quantity without closing the drawer or navigating. Instant feedback with a brief count animation.

**Empty cart state:** "سلتك فاضية — استعرضي المنتجات" with a browse button. Not just "No items in cart."

---

## Checkout Flow

### The Recommendation: Progressive Single-Page on Mobile

A multi-step wizard with separate pages for each step creates navigation overhead and loses context as the user moves between steps. On mobile Egyptian 4G, each step is a page load. A progressive single-page approach — where each section expands as the previous is completed — keeps the user in one document, with the completed steps always visible above.

**Sections:**
1. **Contact info** (phone — pre-filled if logged in, or login prompt)
2. **Delivery address** — three paths (see below)
3. **Order summary** — always visible on the right side (desktop) or collapsible accordion (mobile)
4. **Payment** — COD vs Kashier card/installments
5. **Confirm** — the final review before submit

Each section is marked complete with a green check and collapses to a summary row. The user can re-open any completed section to edit.

### Address Input: Three Paths

**Path A — Geolocation:**
- "استخدمي موقعك الحالي" button
- Browser geolocation → reverse geocode → match to governorate + district in our DB
- Show map pin for confirmation — "هل ده العنوان الصح؟"
- On confirmation: auto-fill governorate + district dropdowns, street field for detail

**Path B — Manual Dropdowns:**
- Governorate dropdown (from `hvar_erp.cities` — these are actually governorates)
- District dropdown (populated after governorate selection, from `hvar_erp.districts WHERE city_id = ?`)
- Street/apartment field (free text, required)
- Building name / landmark (free text, optional but strongly encouraged for delivery)

**Path C — Saved Address:**
- If the user is logged in and has saved addresses: show address cards, "اختاري عنوان محفوظ"
- Option to use a saved address + option to add a new one

**Why no free-text city entry:** Egyptian addresses are not standardized. Free-text city entry produces "Maadi," "المعادى," "Ma'adi," and "معادي" all meaning the same district. The dropdown constrained to the ERP's districts table ensures that the shipping address is always in a format Bosta can process and that matches the ERP webhook payload requirements.

### COD vs. Kashier Selection

The payment selection should visually communicate the trust difference:

- **COD block:** "ادفع لما الطلب يوصل" as the label, brief explanation, COD icon. Visually emphasized — this is the primary choice for most users.
- **Kashier block:** Card icons (Visa, Mastercard), installment logos (ValU, Souhoola, Aman). Secondary visually but still clearly presented.

When Kashier is selected: show the `total_amount` and the redirect notice ("هتنتقلي لصفحة الدفع الآمنة من كاشير"). Never show the Kashier redirect as a surprise — the user should know they are leaving the page.

**The Kashier HPP flow from the UX side:**
1. User selects card payment → clicks "أتمام الطلب"
2. We create the pending_payment record, then redirect to Kashier HPP
3. Kashier processes payment → redirects back to our callback URL
4. Callback validates HMAC, completes the order, redirects to order confirmation page
5. If user abandons Kashier and returns to hvarstore.com: pending_payment record exists, we can show "استأنفي الدفع" or offer COD instead

### Order Summary

The order summary must be visible at all times during checkout:

- On desktop: fixed right column
- On mobile: sticky collapsible bar at the top ("سلتك — X منتجات — X,XXX جنيه" which expands to full line-item list)

Never hide the order summary behind a "view order" button. The buyer must be able to see what they are buying without extra steps.

---

## Service Tickets UX

### The Three Ticket Types

| Type | Arabic | What it is | When to use |
|------|--------|-----------|------------|
| HVM | صيانة | Maintenance — product needs repair | Product stopped working, malfunctioning |
| HVR | استبدال | Replacement — product defective beyond repair | Unit-level replacement under warranty |
| HVT | مرتجع | Return — customer wants to return | Product returned within return window |

### Ticket Creation Flow

**Step 1: Type selection**
Show three clearly labeled cards — one per ticket type. Each card has:
- The type name in Arabic (صيانة / استبدال / مرتجع)
- A one-line description of when to use it
- An icon (SVG, not emoji)

Do not make the user understand the internal ticket codes (HVM/HVR/HVT). These are system identifiers, not user-facing language.

**Step 2: Product identification**
- Option A: "الطلب ده من طلباتي" — pick from order history. Preferred path for registered users.
- Option B: Enter order ID manually for users who bought elsewhere or can't find the order
- Option C: "مش عارفة رقم الطلب" — contact via WhatsApp (this is better than blocking the user)

**Step 3: Issue description**
Free text field. Prompt: "اوصفي المشكلة بالتفصيل — ده بيساعدنا نخدمك أسرع."

**Step 4: Confirmation**
Summary of: ticket type, product, contact phone, issue description. Submit button.

After submission: "تم استلام طلبك" confirmation screen with the ticket reference number and expected first contact timeframe.

### Ticket Status UI (ServiceStepper — P10)

The P10 pattern: a horizontal stepper with circular dot markers connected by a gradient line. RTL-aware — the line flows from right to left.

**State progression visualization:**

For HVM (Maintenance):
```
[PENDING] — [وصل المركز] — [في الورشة] — [جاهز] — [مغلق]
```

Each completed step: filled dot, Hvar red. Current step: pulsing dot, red. Future steps: empty dot, muted. Failed/cancelled: red X.

**Explaining ticket states to non-technical Egyptian users:**

| State | What to show | Not to show |
|-------|-------------|-------------|
| PENDING | "في الانتظار — هنتواصل معاكِ قريبًا عشان نرتب الاستلام" | "PENDING" |
| HUB_RECEIVED | "وصل المركز — جاري الفحص والتقييم" | "HUB_RECEIVED" |
| IN_WORKSHOP | "في الورشة — الجهاز بيتصلح" | "IN_WORKSHOP" |
| READY | "جاهز — هنتواصل معاكِ لمواعيد التوصيل" | "READY" |
| CLOSED | "تم الإغلاق — شكرًا لتعاملك مع هفار" | "CLOSED" |
| CANCELLED | "تم الإلغاء" | "CANCELLED" |
| FAILED | "تعذّر الإتمام — تواصلي معانا لمعرفة الخطوات التالية" | "FAILED" |

---

## Empty States

Every list in hvarstore.com has an empty state. The principle: empty states are navigation moments — tell the user not just that the list is empty, but what to do next.

| Page | Empty condition | Arabic copy | CTA |
|------|----------------|-------------|-----|
| Orders list | No orders placed | "مفيش طلبات لحد دلوقتي" | "تسوقي دلوقتي" → products |
| Tickets list | No tickets opened | "مفيش تذاكر خدمة لحد دلوقتي. لو عندك منتج محتاج صيانة أو استبدال، ابدئي هنا." | "افتحي تذكرة" → ticket form |
| Search results | No products match | "مفيش نتايج لـ '[query]'" | Suggest categories or clear search |
| Cart (via drawer) | Cart is empty | "سلتك فاضية" | "استعرضي المنتجات" |
| Saved addresses | No addresses saved | "مفيش عناوين محفوظة" | "أضيفي عنوان جديد" |

**Empty state design:**
- A simple illustration or icon (not a stock image)
- The copy in warm authority voice — matter-of-fact, not apologetic, not cute
- A single CTA button — not multiple options

---

## Error States

### Form Validation Errors

- Inline, immediately adjacent to the field that caused the error
- Arabic, specific: "رقم الموبايل المصري لازم يبدأ بـ 01" not "رقم غير صالح"
- Red text, small icon — visually associated with the field
- Not a modal, not a toast — inline position

### API Errors

- **Network error / timeout:** "في مشكلة في الاتصال — تأكدي من النت وجربي تاني" with a retry button
- **Stock conflict at checkout:** not an error page — a friendly inline message: "عدد القطع المتاحة أقل مما اخترتِ. غيّري الكمية للمتاح وأتمي الطلب." with the available quantity shown
- **Payment failure (Kashier):** "الدفع لم يتم — تأكدي من بيانات البطاقة أو اختاري طريقة دفع مختلفة" with options to retry or switch to COD
- **Session expired:** "انتهت جلستك — سجلي دخولك تاني" — no data loss if the cart is in localStorage (it persists)

**Never:** raw error codes in Arabic UI. Never: "Error 500" or "database error" visible to customers. Never: a blank white page as the error state.

### Stock Depleted on Checkout

This is one of the most frustrating moments in the buyer journey and must be handled gracefully:
- Do not crash the checkout flow
- Show: "عدد القطع المتاحة أقل — في [N] قطعة فقط متاحة"
- Offer: [Update quantity to N] or [Remove item] or [Contact via WhatsApp about availability]
- Never: show a generic error and clear the cart

---

## Mobile-First Rules

### Touch Targets

44px minimum in both dimensions. This applies to every interactive element: buttons, links, checkboxes, radio buttons, quantity steppers, close buttons, select dropdowns. If a visual element needs to be smaller, add invisible padding.

### Bottom-Heavy Navigation

The thumb zone on a smartphone is the bottom third of the screen. Critical actions belong there:
- CartFAB: fixed bottom corner
- StickyMobileCta: fixed bottom bar on PDP
- Cart drawer CTA: at the bottom of the drawer
- Primary checkout button: bottom of each section

Top navigation (Navbar) is for orientation, not for primary action. The user should be able to complete the most common actions (add to cart, checkout, view cart) without reaching to the top of the screen.

### Safe Area Insets

For iPhone models with a notch and home bar (iPhone X and later, which represent a significant portion of Egyptian iOS users): respect `env(safe-area-inset-bottom)` and `env(safe-area-inset-top)`. The CartFAB needs `bottom: calc(1rem + env(safe-area-inset-bottom))`. The StickyMobileCta needs `padding-bottom: env(safe-area-inset-bottom)`.

### No Hover-Only Interactions

Hover states are desktop-only. Every interaction that is triggered by hover on desktop must have a mobile equivalent — either always visible, or triggered by tap. Product card shine (P6) is a hover effect on desktop and a visible-state element on mobile.

### Swipe Gestures

- PDP image gallery: swipe left/right to navigate
- CartDrawer: swipe to close (swipe toward the leading edge)
- No custom swipe gestures that conflict with the browser's native scroll — only use swipe on elements that are positioned to accept it without conflicting with vertical scroll

---

## Loading States

### Skeleton Screens

Product lists, order lists, and ticket lists use skeleton screens — placeholder elements shaped like the content, with a shimmer animation.

```
[Product card skeleton: gray rectangle for image, two gray bars for name and price]
[Repeated for the grid layout]
```

The skeleton should be the exact dimensions of the content that will load — not a generic loading placeholder. This reduces layout shift when content arrives.

### Point-Action Spinners

Spinners appear only for user-triggered point actions where the system is processing:
- Add to cart button: spinner inside the button while the action is processing
- Checkout submit: spinner inside the button, button disabled during processing
- Ticket submit: same pattern

**Never:** a full-viewport overlay spinner that blocks all interaction. If the action takes more than 2 seconds, show progress feedback while keeping the rest of the page interactive.

### Optimistic Updates

For the cart: update the cart item count (CartFAB badge) immediately when "add to cart" is clicked, before the action completes. If the action fails, roll back. This makes the interaction feel instantaneous.

For the cart quantity stepper: update the displayed quantity immediately, then sync to the store. Do not wait for Nanostores to update before showing the new number.
