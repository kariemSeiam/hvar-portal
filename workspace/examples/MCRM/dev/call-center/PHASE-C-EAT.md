# Phase C — Leader Workflow (Unified) (Eaten)

> **Purpose:** ALL call-center orders require leader approval before becoming a ticket. No exceptions.
> **Source:** leader-approval-workflow.md, API_ENDPOINTS, user decision
> **Update:** Request-info restructured — see REQUEST-INFO-RESTRUCTURE.md. Request-info now sets status=new (no info_requested state).

---

## Unified Flow

**Every type (Sell, R, M, T):**
```
Agent confirms → status=confirmed (no ticket)
   → Leader queue
   → Leader Approve → ticket created, status=converted
   → Leader Reject → status=new (back to agent)
   → Leader Request-info → status=new (order returns to agent queue; message in snapshot)
```

**confirm-by-customer:** No longer creates ticket. Creates call record, sets status=confirmed, stores confirmation_snapshot (items, address, notes) for leader to use on approve.

**leader-approve:** Reads confirmation_snapshot, creates ticket (sell/R/M/T), sets status=converted, approved_by, approved_at.

---

## Backend Changes

### Migration 005
- `approved_by INT NULL`
- `approved_at DATETIME NULL`
- `confirmation_snapshot JSON NULL` — stores agent's confirm payload for leader-approve

### confirm-by-customer (refactored)
- Validate order, call_type
- For sell: require items
- Create call record (status=confirmed)
- Update order: status=confirmed, confirmation_snapshot={items, customer_name, phone, address, governorate, city, cod_amount, notes}
- Do NOT create ticket

### New endpoints
- GET /api/call-center/pending — status=confirmed, converted_to_ticket_id IS NULL
- POST /api/call-center/orders/:id/leader-approve — create ticket from confirmation_snapshot
- POST /api/call-center/orders/:id/reject — status=new
- POST /api/call-center/orders/:id/request-info — status=new (message in snapshot)

---

## Frontend Changes

- confirmOrder: unchanged API call; backend behavior changes
- processOrderToHub → leaderApprove (for confirmed orders)
- Leader tab: pending orders, Approve/Reject/Request-info
- Auth: leader tab visible when role=team_leader

---

## Migration (run before first use)

Copy `dev/call-center/005_leader_workflow.sql` to `migrations/005_leader_workflow.sql` and run:

```bash
python migrations/run_migrations.py up
```

Adds: `approved_by`, `approved_at`, `confirmation_snapshot`. (Migration 005 may extend status enum with `info_requested` for legacy compat; app uses status=new for request-info.)

---

*Unified. All through leader.*
