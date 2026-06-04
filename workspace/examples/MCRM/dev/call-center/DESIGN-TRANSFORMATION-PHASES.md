# Call Center — Design Transformation (Eat by Eat)

> **Purpose:** Phase-by-phase design changes to match vision + Design Genome. What exists vs what perfect looks like.
> **Source:** call-session-cycle, workflow, GAPS-AND-TRANSFORMATION, hub-design.mdc, design-tokens.css

---

## What Phase A Actually Changed

| Item | Status | Files Touched |
|------|--------|---------------|
| Call type selector | Done | CallSessionFAB.jsx, callCenterAPI.js |
| Escalated tab | Done | CustomerServicePage.jsx |
| Search → API | Done | CustomerServicePage.jsx |
| Cancellation dropdown | Done | CallSessionFAB.jsx |

**Design changes in Phase A:** Minimal. Added functional elements. No genome alignment, no layout reorg, no signature polish.

---

## Design Genome (Must Apply)

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `bg-brand-red-600` (#e11d48) | Primary buttons, CTAs, active states |
| Secondary | `bg-brand-blue-600` | Secondary actions, links |
| Success | `accent-green-500` | Confirm, completed |
| Warning | `accent-amber-500` | Scheduled, pending |
| Error | `error-500` | Cancel, failed |
| Card | `rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6` | Surfaces |
| Button | `rounded-lg font-cairo` | All buttons |
| Focus | `focus:ring-2 focus:ring-brand-red-500` | Inputs, buttons |

**Fonts:** Cairo headings, Tajawal body. **RTL:** dir="rtl". **Motion:** 150ms fast, 250ms normal.

---

## Phase A — Design Polish (What’s Still Missing)

### 1. Call Type Selector

**Current:** Gray bar, generic select, `focus:ring-brand-blue-500`.

**Perfect:**
- Use genome primary for active/selected: `border-brand-red-600` when focused
- Label: `font-cairo font-medium`
- Bar matches card style: `bg-card-light` / `bg-card-dark` from tokens
- Option list RTL-correct

### 2. Escalated Tab

**Current:** Uses `amber` like scheduled — no distinct visual.

**Perfect:**
- Tab colors: green (new), amber (scheduled), purple (confirmed), blue (completed), red (canceled)
- Add to TabNavigation `getGlassTabActive` if missing
- Badge: distinct from scheduled (e.g. `bg-rose-100` vs `bg-amber-100`)

### 3. Cancellation Modal

**Current:** Standard select + conditional textarea.

**Perfect:**
- Select: `border-gray-300 dark:border-gray-600 rounded-md focus:border-brand-blue-500 focus:ring-1`
- "أخرى" notes: `rounded-md` per input spec
- Modal overlay: `bg-black bg-opacity-50` per hub-design
- Danger button: `bg-brand-red-600 hover:bg-brand-red-700`

### 4. Outcome Buttons

**Current:** Mix of green/amber/blue/red — some hardcoded Tailwind.

**Perfect:**
- Confirm: `bg-accent-green-500` (genome success)
- Schedule: `bg-brand-blue-600` (secondary)
- No answer: `bg-accent-amber-500` (warning)
- Cancel: `bg-brand-red-600` or `bg-error-600`
- All: `rounded-lg font-cairo` + hover states from tokens

---

## Phase B — Direct Call / New Inquiry (Design)

### Entry Point

**Add:** "استفسار جديد" / New inquiry button in PageHeader or FAB.

**Design:**
- Primary CTA: `bg-brand-red-600` for prominence
- Or secondary: `bg-brand-blue-500`
- Icon: Phone or Plus
- Placement: Right of sync button (RTL = visual left)

### CallSessionFAB order=null

**Layout:** Same structure, but:
- Customer section: empty or search-first
- Call type: default ASK, all five options visible
- Outcome buttons: Confirm(ASK) → ask-only; Confirm(typed) → different flow
- No Bosta/Services tabs until customer found

**Design:** Reuse same cards, tokens. Add empty state: "ابحث عن رقم العميل" with search input.

---

## Phase C — Leader Workflow (Design)

### Leader Queue

**New:** Tab or route for leader.

**Design:**
- Reuse OrdersTable pattern
- Status chips: pending / approved / rejected
- Actions: Approve (green), Reject (red), Request info (amber)
- Card: same `rounded-lg shadow-sm border`

### Process to Hub

**Current:** Button exists, mock.

**Design:** When real — use primary `bg-brand-red-600` or success `bg-accent-green-500` for "تمت المعالجة".

---

## Phase D — Full UI/UX Recreation

### 1. Information Architecture

**Vision layout (call-session-cycle):**
```
CALL TYPE [dropdown]     ← Always first
CUSTOMER INFO           ← Editable card
ORDER / REQUEST DETAILS  ← Items, COD
CALL HISTORY             ← Read-only list
OUTCOME BUTTONS          ← Bottom or sticky
```

**Current:** Call type first. Customer + Bosta/Services tabs. Items. Outcomes.

**Change:** Ensure order matches vision. Call history always visible (not hidden in tab). Outcome bar sticky at bottom.

### 2. Empty States

**Per tab:** all, new, scheduled, confirmed, completed, canceled, inquiries.

**Design:** Use EmptyState with variant per hub-design (default, minimal, etc). Icon + title + description. No raw "لا توجد طلبات" without structure.

### 3. Loading / Error

**Loading:** Skeleton rows for OrdersTable. Spinner for CallSessionFAB.

**Error:** Inline message + retry. `toast` for transient errors. No alert().

### 4. Mobile

**Call session:** Full-screen on &lt;640px. FAB stays. Outcomes: bottom sheet or full-width bar.

**QueueStatusBar:** Horizontal scroll, touch-friendly chips.

**OrdersTable:** Card mode on mobile (collapse columns).

### 5. Accessibility

- Focus rings: `focus:ring-2 focus:ring-brand-red-500`
- aria-labels on icon-only buttons
- Keyboard: Tab through outcome buttons
- Reduced motion: `prefers-reduced-motion` → shorter durations

---

## Eat-by-Eat Checklist

### Phase A (Done)

- [x] Call type selector: genome primary focus ring, card-style bar, rounded-md
- [x] Escalated tab: rose color, added to TabNavigation getTabColorClasses + getGlassTabActive
- [x] Cancellation modal: genome input styles (focus:ring-brand-red-500), rounded-md
- [x] Outcome buttons: accent-green, accent-amber, brand-blue, brand-red tokens; font-cairo

### Phase B

- [x] New inquiry button: genome primary, placement (PhoneCall icon)
- [x] CallSessionFAB order=null: context from getCustomerContextByPhone, OrderItemsEditor
- [x] ASK in dropdown when order=null

**Implementation spec:** [PHASE-B-EAT.md](PHASE-B-EAT.md), [PHASE-B-PLUS-EAT.md](PHASE-B-PLUS-EAT.md) — built.

### Phase C

**Implementation spec:** [PHASE-C-EAT.md](PHASE-C-EAT.md) — eaten, ready for build.

- [x] Leader tab/route: tab "مؤكدة", OrdersTable with leader actions
- [x] Approve/Reject/Request-info: genome button colors
- [x] Process to Hub: processOrderToHub (leader-approve), real implementation

### Phase D

- [x] IA: call history always visible (آخر المكالمات collapsible section)
- [x] Empty states: EmptyState variants per tab (creative, warm, purple, vibrant, minimal, default)
- [x] Loading: skeletons (OrdersTable)
- [ ] Mobile: full-screen session, bottom outcome bar
- [x] A11y: focus genome (focus:ring-brand-red-500, focus:border-brand-blue-500), aria on icon buttons

---

## Quick Reference — Token Classes to Use

```css
/* Primary CTA */
bg-brand-red-600 hover:bg-brand-red-700 text-white

/* Secondary */
bg-brand-blue-500 hover:bg-brand-blue-600

/* Success */
bg-accent-green-500

/* Warning */
bg-accent-amber-500

/* Error/Cancel */
bg-brand-red-600 or bg-error-600

/* Card */
rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6

/* Input focus */
focus:ring-2 focus:ring-brand-red-500 focus:border-brand-blue-500
```

---

*Eaten. Each phase = functional + design. Perfect = genome everywhere.*
