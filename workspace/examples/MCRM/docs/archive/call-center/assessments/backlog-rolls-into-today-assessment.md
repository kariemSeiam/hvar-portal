# Backlog Rolls Into Today — Design Assessment

> Is this the cleanest change? Does it fit everything we've built?

---

## Verdict

Yes — with one condition: **single shared date-condition helper**. Semantics match agent mental model. Surface change is minimal. Fits all existing filters and UI.

---

## What We're Changing

| Chip | Current | Proposed |
|------|---------|----------|
| **Today** | `created_at` in today | (backlog open) ∪ (created today) |
| **Future** | `created_at` in that day | `scheduled_callback_at` in that day |

**Backlog** = past orders still open (`status IN ('new','scheduled','confirmed','escalated')`).

---

## Fit Check — Existing Pieces

| Piece | Interaction | Fit |
|-------|-------------|-----|
| **Status filter (tabs)** | listOrders passes `status`. Model adds `AND status = X` to both backlog and today branches. | ✓ Same filter applies |
| **Search** | Already in WHERE. Applies to both branches. | ✓ |
| **Pagination** | `get_orders_count` uses same filters as `list_orders`. Must share date logic. | ✓ Via shared helper |
| **QueueStatusBar** | Fetches counts for 7 days. Needs `today` param for "today" chip only when date≤today. | ✓ Pass today from frontend |
| **CustomerServicePage** | listOrders + getOrderCounts with date. Add today (derived from selectedDate or fresh Date). | ✓ |
| **Source / service_type / governorate** | Existing filters. Unchanged. | ✓ |
| **Order lifecycle** | Open = new, scheduled, confirmed, escalated. Matches CONTEXT_SUMMARY. | ✓ |

---

## Alternative Designs (Rejected)

| Option | Why Not |
|--------|---------|
| Add "Yesterday" chip only | Backlog stays on yesterday. Today stays empty. User wanted backlog to roll into today. |
| Server-side "today" | Timezone risk. Server UTC vs Egypt. Client knows user's "today"; passing it is safer. |
| Separate "Overdue" view | More UI, more concepts. Not what user asked. |
| Change nothing | Doc already says "roll old orders into today — No." User wants Yes. |

---

## Clean Implementation Rules

1. **One helper** — `_build_date_where(date_str, today_str, date_from, date_to)` in `order.py`. Returns (conditions, params). Used by `list_orders`, `get_orders_count`, `get_orders_counts_by_status`.
2. **Optional `today`** — When absent, keep current behavior (created_at). Backward compatible.
3. **Open set fixed** — `('new','scheduled','confirmed','escalated')` from order-lifecycle.
4. **Frontend** — Pass `today=YYYY-MM-DD` in listOrders and getOrderCounts. derive from `new Date().toISOString().split('T')[0]`.

---

## Edge Cases

| Edge | Handling |
|------|----------|
| Timezone | Frontend sends today in user's local date. Backend uses it. No server TZ logic. |
| date > today | Use `scheduled_callback_at` in range. No backlog. |
| date = today | Backlog mode. (backlog open) ∪ (created today). |
| date < today (past) | Not in current UI (7 chips = today + 6 future). If we add past chips later: backlog only for that day's created_at, or treat as "date = that day" with same logic. Defer. |
| Status filter + backlog | Backlog branch: `created_at < date_start AND status IN open AND status = ?`. Redundant but correct. Simplify: when status given, `AND status = %s` in outer WHERE. |

---

## Summary

- **Semantics:** Today = "what I work today" = backlog + today's new. Future = "what's scheduled that day." Correct.
- **Technical:** One helper, one optional param. Minimal, coherent.
- **Fit:** Status, search, pagination, QueueStatusBar, tabs — all work.
- **Risk:** Low. Shared helper prevents drift. Timezone handled by client.

Implement per plan. The design is clean and fits the call center.
