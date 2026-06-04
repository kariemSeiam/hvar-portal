# Phase D — Full UI/UX (Eaten)

> **Purpose:** Consolidated eat of call-center phase state. All arms. Ready for build.
> **Source:** design-tokens, DESIGN-TRANSFORMATION-PHASES, call-session-cycle, GAPS, CONTEXT_SUMMARY, CallSessionFAB, CustomerServicePage, TabNavigation, EmptyState

---

## Anatomy Absorbed

### Design Genome (Tokens)

| Token | Value | Usage |
|-------|-------|-------|
| Primary | `bg-brand-red-600` #e11d48 | Primary buttons, CTAs, active states |
| Secondary | `bg-brand-blue-600` #0284c7 | Secondary actions, links |
| Success | `bg-accent-green-500` | Confirm, completed |
| Warning | `bg-accent-amber-500` | Scheduled, pending |
| Error/Cancel | `bg-brand-red-600` / `bg-error-500` | Cancel, failed |
| Escalated | `bg-rose-600` / `rose` color | Supervisor queue |
| Card | `rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6` | Surfaces |
| Button | `rounded-lg font-cairo` | All buttons |
| Focus | `focus:ring-2 focus:ring-brand-red-500` | Inputs, buttons |
| Input focus | `focus:border-brand-blue-500 focus:ring-1` | Per spec |

**Fonts:** Cairo headings, Tajawal body. **RTL:** dir="rtl". **Motion:** 150ms fast, 250ms normal. **Reduced:** prefers-reduced-motion → 0.01ms.

---

## Current State — What Exists

| Component | File | Status |
|-----------|------|--------|
| Call type selector | CallSessionFAB | ✓ Top bar, focus:ring-brand-red-500, focus:border-brand-red-500 |
| Outcome buttons | CallSessionFAB | ✓ accent-green, accent-amber, brand-blue, brand-red — genome-aligned |
| Cancellation modal | CallSessionFAB | ✓ Structured dropdown, focus:ring-brand-red-500 on select |
| Escalated tab | CustomerServicePage | ✓ rose color, TabNavigation getGlassTabActive |
| Search → API | CustomerServicePage | ✓ listOrders(search=) when query ≥ 2 chars |
| New inquiry | CustomerServicePage | ✓ Button, modal, getCustomerContextByPhone |
| Phase B+ direct confirm | CallSessionFAB | ✓ createDirectOrder + confirmOrder for sell/R/M/T |
| Leader workflow | CustomerServicePage | ✓ processOrderToHub, leaderReject, leaderRequestInfo |
| EmptyState | CustomerServicePage | ✓ Tab-specific variants + icons (creative, warm, purple, vibrant, minimal, default) |

---

## Gaps (Phase D Scope)

### 1. Call Type Selector — Card-Style Bar

**Current:** `border-b border-gray-200`, plain bar. Select has genome focus.

**Perfect:**
- Bar: `bg-white dark:bg-gray-800 rounded-t-xl border-b border-gray-200 dark:border-gray-700` (card surface)
- Label: `font-cairo font-medium` ✓ already
- Select when focused: `focus:ring-2 focus:ring-brand-red-500` ✓ already

**Change:** Add card-like surface: `bg-gray-50 dark:bg-gray-800/50` or match expanded content bg. Low effort.

---

### 2. Escalated Tab — Distinct Badge

**Current:** rose in getGlassTabActive. Tab uses rose color.

**Perfect:** Badge when active: `bg-white/20`. Inactive: `bg-rose-100 dark:bg-rose-900/30` (distinct from amber scheduled).

**Status:** TabNavigation has color variants. Escalated tab removed; 3+ no_answer stay in queue.

---

### 3. Confirm Modal — Delivery Date Input

**Current:** `focus:ring-2 focus:ring-blue-500` (generic blue).

**Perfect:** `focus:ring-2 focus:ring-brand-red-500 focus:border-brand-blue-500` per genome.

**Files:** CallSessionFAB.jsx — confirm modal date input (line ~1530).

---

### 4. Empty States — Tab-Specific Variants

**Current:** Single EmptyState, default variant, PackageSearch icon. Description varies by tab.

**Perfect (hub-design §5):**
- Use EmptyState variants: `default`, `minimal`, `creative`, `elegant`, `vibrant`, `warm`, `cool`, `purple`
- Map tab → variant: new=creative, scheduled=warm, confirmed=purple, completed=vibrant, canceled=minimal
- Icon per tab: PackageSearch (new/scheduled), CheckCircle (confirmed/completed), XCircle (canceled)

**Files:** CustomerServicePage.jsx — EmptyState usage.

---

### 5. Information Architecture — Call Session Order

**Vision (call-session-cycle):**
```
CALL TYPE [dropdown]     ← Always first
CUSTOMER INFO            ← Editable card
ORDER / REQUEST DETAILS   ← Items, COD
CALL HISTORY              ← Read-only list
OUTCOME BUTTONS           ← Bottom or sticky
```

**Current:** Call type first ✓. Customer + Bosta/Services tabs. Items. Notes. **Call history always visible** (آخر المكالمات collapsible). Custom delivery. Outcome bar.

**Done:** Call history section in right column, between Notes and Actions. Collapsible, genome-styled.

---

### 6. Loading — Skeletons

**Current:** OrdersTable shows Loader2 spinner or nothing. CustomerServicePage uses isLoading.

**Perfect:** Skeleton rows for OrdersTable when loading. Same structure as real rows, gray pulse.

**Files:** OrdersTable.jsx — add skeleton state.

---

### 7. Notes Textarea — Focus Ring

**Current:** `focus:ring-brand-blue-500` in some places.

**Genome:** Prefer `focus:ring-brand-red-500` for primary focus, or `focus:border-brand-blue-500` for inputs.

**Check:** CallSessionFAB notes textarea — line 1354 has focus:ring-brand-blue-500. Genome says focus:ring-brand-red-500 for inputs. DESIGN-TRANSFORMATION says focus:border-brand-blue-500. Use focus:border-brand-blue-500 focus:ring-1 for inputs.

---

### 8. New Inquiry Button — Genome Primary

**Current:** PhonePlus icon, likely secondary styling.

**Perfect:** Primary CTA `bg-brand-red-600` for prominence, or `bg-brand-blue-500` secondary. Placement: right of sync (RTL = visual left).

**Files:** CustomerServicePage.jsx — rightControls, new inquiry button.

---

## Implementation Checklist (Phase D)

| # | Item | File(s) | Status |
|---|------|---------|--------|
| 1 | Confirm modal date input: focus:ring-brand-red-500 | CallSessionFAB.jsx | ✓ Done |
| 2 | Empty states: tab → variant + icon mapping | CustomerServicePage.jsx | ✓ Done |
| 3 | New inquiry button: bg-brand-red-600 or genome primary | CustomerServicePage.jsx | ✓ Already genome |
| 4 | Call type bar: subtle bg (card-style surface) | CallSessionFAB.jsx | ✓ Done |
| 5 | Notes textarea: focus:border-brand-blue-500 focus:ring-1 | CallSessionFAB.jsx | ✓ Done |
| 6 | OrdersTable: skeleton rows when loading | OrdersTable.jsx | ✓ Done |
| 7 | Call history: always visible (آخر المكالمات collapsible) | CallSessionFAB.jsx | ✓ Done |

---

## Risk & Dependency

| Risk | Mitigation |
|------|------------|
| Skeleton layout mismatch | Match OrdersTable row structure exactly |
| EmptyState variant mismatch | Use existing variants; add icon prop mapping |
| Call history reflow | Keep current tab structure; add "آخر المكالمات" collapsible if needed |

---

## Order of Work

1. **Quick wins (1–5):** Token swaps, variant mapping — ~30 min
2. **Skeleton (6):** OrdersTable loading state — ~45 min
3. **IA (7):** Call history visibility — optional, assess UX impact first

---

## File Map

| File | Phase D Touches |
|------|-----------------|
| `front/src/components/call-center/CallSessionFAB.jsx` | Confirm modal input, notes focus, call type bar |
| `front/src/pages/CustomerServicePage.jsx` | EmptyState variants, new inquiry button |
| `front/src/components/call-center/OrdersTable.jsx` | Skeleton rows |

---

## Token Quick Reference

```css
/* Primary CTA */
bg-brand-red-600 hover:bg-brand-red-700 text-white

/* Success / Confirm */
bg-accent-green-500 hover:bg-accent-green-600

/* Warning / No answer */
bg-accent-amber-500 hover:bg-accent-amber-600

/* Secondary / Schedule */
bg-brand-blue-600 hover:bg-brand-blue-700

/* Cancel */
bg-brand-red-600 hover:bg-brand-red-700

/* Input focus */
focus:ring-2 focus:ring-brand-red-500 focus:border-brand-blue-500
```

---

*Eaten. All arms. Ready for build.*
