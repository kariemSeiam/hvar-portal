# Leader Approval Workflow

> Quality gate before service ticket creation. Agents prepare → Leaders approve/reject/request-info.

---

## Flow

```
Agent completes order (status: pending|confirmed)
  → appears in leader queue GET /api/call-center/pending
  → leader reviews: customer info, service type, items, call history
  → APPROVE → service ticket created (status: converted, ticket: PENDING)
  → REJECT  → returns to draft, agent notified
  → REQUEST INFO → stays in queue, agent assigned a task
```

---

## 3 Actions

### Approve → creates ticket

```
POST /api/call-center/orders/{id}/leader-approve
{ "leader_notes": "...", "override_stock": false }

Response: { order_id, ticket_id, ticket_number: "HVR251020001" }
```

What happens:
- Validates: `status IN (pending, confirmed)`, `service_type NOT NULL`, `customer_id NOT NULL`, user `role = team_leader`
- Generates ticket number: `HV{R|M|T|S}{YYMMDD}{SEQ:03d}`
- Creates `service_tickets` row (status: PENDING)
- Updates order: `status=converted, approved_by, approved_at, converted_to_ticket_id`

### Reject → returns to agent

```
POST /api/call-center/orders/{id}/reject
{ "rejection_reason": "...", "rejection_notes": "...", "return_to_agent_id": 5 }

Response: { order_id, status: "draft" }
```

Order moves to `draft`. Agent notified. Agent fixes → resubmits.

### Request Info → order returns to agent queue (new)

```
POST /api/call-center/orders/{id}/request-info
{ "message": "..." }
```

Order status → `new` (no separate info_requested state). Message stored in `confirmation_snapshot.info_request_message`. Order appears in **جديدة**; agent opens call session, sees "طلب المشرف", edits data/notes, then confirms (confirm-by-customer) → order back in مؤكدة.

---

## Queue

```
GET /api/call-center/pending?source=&service_type=&status=&sort=created_at_desc
```

Returns: `status IN (pending, confirmed)` AND `approved_by IS NULL`

Filter options: source (erp/bosta/direct), service_type (R/M/T/S), status (pending/confirmed)

---

## Ticket Number Format

```
HV + TYPE + YYMMDD + SEQ(3)
HVR251020001 = Replacement, 2025-10-20, first ticket of the day
```

| Prefix | Type |
|--------|------|
| HVR | Replacement (استبدال) |
| HVM | Maintenance (صيانة) |
| HVT | Return (استرجاع) |
| HVS | Sell (بيع) |

Sequence: daily, per type, resets to 001. Max 999/type/day.

---

## Post-Approval

```
Order: status=converted (read-only, archived, linked via converted_to_ticket_id)
Ticket: status=PENDING → enters hub service workflow
```

View converted: `GET /api/call-center/orders/{id}?include=converted_ticket`

---

## Common Errors

| Error | Cause | Action |
|-------|-------|--------|
| Service type required | agent didn't set R/M/T/S | reject + message |
| Customer info incomplete | invalid phone, no customer_id | reject + message |
| Stock not available | replacement item OOS | show stock status, allow override |
| Duplicate ticket | similar ticket in last 30 days | `GET /api/call-center/check-duplicates?customer_phone=&service_type=&days=30` |
| Not team_leader | wrong role | 403 PermissionError |
