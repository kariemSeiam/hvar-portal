# Orders Table — Recommended Implementation Path

> **All minds.** One path to "real perfect" implementation. No half-measures.

---

## Principle (Thich Nhat Hanh)

**One thing first. Simplify.** Don't build orders + calls + API + frontend in one sprint. Layer by layer, with a verification gate before moving on.

---

## Phasing (recommended order)

### Phase 1 — DB only (no application logic yet)

**Goal:** Tables exist. No code depends on them. Safe to roll back.

| Step | Action | Verify |
|------|--------|--------|
| 1.1 | Create migration file `migrations/004_orders_and_calls.sql` | File exists |
| 1.2 | `CREATE TABLE orders` (exact schema from PLAN.md) | Run migration; `DESCRIBE orders` matches |
| 1.3 | `CREATE TABLE calls` (exact schema from PLAN.md) | Run migration; `DESCRIBE calls` matches |
| 1.4 | `ALTER TABLE service_tickets ADD created_from_order_id` | Column exists, FK valid |
| 1.5 | `ALTER TABLE orders ADD converted_to_ticket_id` (after service_tickets has the column) | Both directions work |
| 1.6 | Run full migration on a copy of prod DB | No errors; existing data untouched |

**Gate:** Migration runs clean. No application code touches these tables yet.

---

### Phase 2 — Models (DB access only)

**Goal:** Read/write orders and calls from Python. No HTTP yet.

| Step | Action | Verify |
|------|--------|--------|
| 2.1 | Create `app/models/order.py` — `create_order`, `get_order_by_id`, `list_orders` (with filters), `update_order` | Unit test or manual script inserts/selects |
| 2.2 | Create `app/models/call.py` — `create_call`, `get_calls_by_order_id`, `get_calls_by_ticket_id` | Same |
| 2.3 | Add `get_order_by_erp_order_id`, `get_order_by_bosta_tracking` for dedup/sync | No duplicate ERP rows |
| 2.4 | Wire `service_ticket.create_ticket` to accept `created_from_order_id`; update `order` when ticket created | Round-trip: order → ticket → order.converted_to_ticket_id |

**Gate:** Models work in isolation. No API, no frontend.

---

### Phase 3 — Call-center API (minimal slice)

**Goal:** One happy path works end-to-end. ERP sync → order in DB → queue → confirm → ticket.

| Step | Action | Verify |
|------|--------|--------|
| 3.1 | Create `app/api/call_center_api.py` blueprint; register in `app/__init__.py` | `GET /api/call-center/health` returns 200 |
| 3.2 | `GET /api/call-center/orders` — list from DB (filters: status, source, service_type, search, pagination) | Frontend or Postman gets real rows |
| 3.3 | `GET /api/call-center/orders/:id` — single order + call history | Response matches PLAN |
| 3.4 | `POST /api/call-center/orders/sync-from-erp` — consume ERP drafts, insert/update orders, trigger Bosta enrich | Orders appear in queue with bosta_tracking when match found |
| 3.5 | `POST /api/call-center/orders/:id/confirm-by-customer` — create call, create ticket, update order | Ticket has created_from_order_id; order has status=converted |
| 3.6 | Add `schedule`, `no-answer`, `cancel` endpoints | Each creates call + updates order correctly |
| 3.7 | `POST /api/call-center/calls/ask-only` — insert call with no order/ticket link | ASK calls don't create orders |

**Gate:** Backend can drive the full ERP→confirm flow without frontend changes. Test with Postman or curl.

---

### Phase 4 — Frontend wire-up

**Goal:** CustomerServicePage uses real API. No more in-memory orders from ERP.

| Step | Action | Verify |
|------|--------|--------|
| 4.1 | Point `callCenterAPI.js` at real endpoints (they already exist as stubs) | Network tab shows 200, real data |
| 4.2 | Replace "ERP fetch → client-side conversion" with "sync-from-erp → GET orders" | Queue shows DB-backed orders |
| 4.3 | Confirm/cancel/schedule/no-answer buttons call real endpoints | Order state persists across refresh |
| 4.4 | Call history from `GET orders/:id` includes calls | UI shows attempt history |

**Gate:** Agent can work a real queue. Data survives refresh. No data loss.

---

### Phase 5 — Leader workflow + edge cases

**Goal:** Leader approve/reject. Escalation. Dedup. Customer 360°.

| Step | Action | Verify |
|------|--------|--------|
| 5.1 | `GET /api/call-center/pending` — orders status IN (confirmed) awaiting leader | Leader queue populated |
| 5.2 | `POST /api/call-center/orders/:id/leader-approve` | Ticket created, order converted |
| 5.3 | `POST .../reject`, `.../request-info` | Order returns to agent or stays pending |
| 5.4 | No-answer 3+: status unchanged; stays in queue | Agent acts: confirm/schedule/cancel/no-answer |
| 5.5 | Dedup: same erp_order_id not inserted twice | No duplicates on re-sync |
| 5.6 | `GET /api/call-center/customers/:phone` — customer + orders + tickets + calls | 360° view complete |

**Gate:** Full call-center flow works. Leader can approve. Escalation and dedup behave correctly.

---

## Risk mitigation (Honnold — rehearse failure)

| Risk | Mitigation |
|------|------------|
| Migration breaks existing DB | Test on copy first; have rollback script (DROP orders, calls; ALTER service_tickets DROP created_from_order_id; ALTER orders DROP converted_to_ticket_id) |
| ERP sync creates duplicates | Unique index on `orders.erp_order_id` or upsert logic (INSERT ... ON DUPLICATE KEY UPDATE) |
| Bosta enrich fails mid-sync | Order still saved; bosta_tracking stays NULL; agent can manually search later |
| Frontend breaks during wire-up | Feature flag or separate route; fallback to current ERP-proxy behavior until stable |
| agent_id in calls has no users table | Use NULL or a simple agents table; defer full auth if needed |

---

## "Perfect" definition (Senna — another dimension)

Perfect here = **complete, consistent, reversible.**

- **Complete:** Every outcome (confirmed, scheduled, no_answer, canceled) creates a call and updates order. No silent gaps.
- **Consistent:** Doc and code match. Same enums. Same field names.
- **Reversible:** Migration can be rolled back. No permanent data loss if we need to revert.

---

## What to build first (Marcus Aurelius — cut)

If you must ship in one shot: **Phase 1 + 2 + 3.1–3.5**. That gives you DB, models, and the core confirm flow. Schedule/no-answer/cancel can be Phase 3.6 in the next pass. Leader workflow (Phase 5) can follow. Don't try to do Phase 5 before Phase 3 is solid.

---

## Checklist before calling it done

- [ ] Migration runs on clean DB and on copy of prod
- [ ] Orders table has correct indexes (status+next_action_at, source+type, erp_order_id, bosta_tracking)
- [ ] No orders with source=erp and service_type=NULL (invariant)
- [ ] ASK calls create calls row with linked_to_order_id=NULL, linked_to_ticket_id=NULL
- [ ] Ticket created from order has created_from_order_id set; order has converted_to_ticket_id set
- [x] 3+ no_answer → status unchanged; stays in queue
- [ ] Frontend queue shows real data; refresh preserves state

---

## Quick reference: recommendation → response

| Recommendation | Response (what you get) |
|----------------|-------------------------|
| **Phase 1 complete** | Tables exist; migration runs clean; rollback script ready. No code touches them yet. |
| **Phase 2 complete** | `order.py` and `call.py` work; insert/select round-trip; no duplicate `erp_order_id`. |
| **Phase 3.1** | `GET /api/call-center/health` → 200 |
| **Phase 3.2** | `GET /api/call-center/orders` → real rows from DB, filters work |
| **Phase 3.3** | `GET /api/call-center/orders/:id` → order + call history |
| **Phase 3.4** | ERP drafts → orders in DB; Bosta enrich fills `bosta_tracking` when match |
| **Phase 3.5** | Confirm → call created, ticket created, order.status=converted |
| **Phase 3.6** | Schedule / no-answer / cancel → call created, order updated |
| **Phase 3.7** | ASK-only → call with no order/ticket link |
| **Phase 4 complete** | Queue shows DB data; refresh keeps state; no in-memory ERP conversion |
| **Phase 5 complete** | Leader approves; escalation works; no ERP duplicates; 360° returns full view |
| **Risks mitigated** | Rollback script exists; `erp_order_id` unique/upsert; agent_id nullable |
| **“Perfect”** | Complete (no outcome gaps), consistent (doc=code), reversible (rollback works) |
| **Cut (ship first)** | Phase 1 + 2 + 3.1–3.5 → DB, models, core confirm flow. Rest follows. |

---

*Recommendation v1.0 | 2026-02-25 | All minds, one path.*
