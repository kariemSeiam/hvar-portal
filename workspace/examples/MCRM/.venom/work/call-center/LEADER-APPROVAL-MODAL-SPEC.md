# Leader Approval Modal — Full Validation Before Ticket Creation

> **Status:** Planning  
> **Date:** 2026-04-09  
> **HELM Direction:** One modal, full validation, tickets start CONFIRMED  
> **OMEN Grade:** Proceed with Critical mitigations

---

## Problem

**Current flow:**
```
Agent تأكيد → snapshot → order.status='confirmed' → pending queue
                                                        ↓
Leader → موافقة (one click) → ticket created → status='PENDING'
                                                        ↓
Hub agent → confirms ticket → status='CONFIRMED' → work begins
```

**Issue:** Three confirmation gates (agent, leader blind-click, hub confirm) when agent + leader have already validated everything.

---

## Solution

**New flow:**
```
Agent تأكيد → snapshot → order.status='confirmed' → pending queue
                                                        ↓
Leader → موافقة → **Modal opens** → validates:
  • Customer (name, phone, location)
  • Original tracking (selected from Bosta)
  • Items (auto-loaded from snapshot)
  • New tracking send/receive (based on type)
  • COD (must != 0)
  • Description + notes (must exist)
                                ↓
Leader fills missing → تأكيد وإنشاء التذكرة
                                ↓
Ticket created with status='CONFIRMED' (skip PENDING)
                                ↓
Hub team picks up → status='IN_PROCESS'
```

---

## Architecture

### 1. Database changes (migration required)

**Add to `service_tickets` table:**
```sql
ALTER TABLE service_tickets 
ADD COLUMN source ENUM('call_center', 'hub', 'erp') DEFAULT 'hub' AFTER service_type;

ALTER TABLE service_tickets 
ADD COLUMN approved_by INT DEFAULT NULL AFTER source,
ADD COLUMN approved_at DATETIME DEFAULT NULL AFTER approved_by;
```

**Why:**
- `source`: Distinguish call-center (starts CONFIRMED) from hub-direct (starts PENDING)
- `approved_by`: Track which leader approved (audit trail)
- `approved_at`: When approval happened

---

### 2. Backend changes

#### A. Enhance `POST /api/call-center/orders/{id}/leader-approve`

**Current payload:**
```json
{
  "user_id": 1,
  "notes": "..."
}
```

**New payload:**
```json
{
  "user_id": 1,
  "customer": {
    "name": "أحمد محمد",
    "phone": "01012345678",
    "governorate": "Cairo",
    "city": "Nasr City",
    "address": "شارع مصطفى النحاس، عمارة 5"
  },
  "original_tracking": "12345-678901",
  "items": [
    {"item_id": 1, "quantity": 1, "direction": "send", "condition": "valid"},
    {"item_id": 2, "quantity": 1, "direction": "receive", "condition": "damaged"}
  ],
  "new_tracking_send": "HVR-20260409-001",
  "new_tracking_receive": "HVR-20260409-002",
  "cod_amount": 500,
  "cost_adjustment": 0,
  "order_description": "استبدال خلاط هفار 2000 وات",
  "notes": "العميل طلب استبدال بسبب عطل في المحرك"
}
```

#### B. Validation in `leader_approve()` (before ticket creation)

**Required checks:**
1. Customer name not empty
2. Phone valid format (`01XXXXXXXXX`)
3. Governorate + city + address not empty
4. Items meet call type requirements:
   - Sell: at least 1 item
   - Replacement: at least 1 send + 1 receive
5. New tracking unique (not in `service_tickets` or `orders`)
6. COD != 0
7. Description + notes not empty

**If any fail:** Return 400 with specific field error.

#### C. Stock reservation BEFORE ticket creation

**Critical fix (from OMEN):**

**Current:**
```python
# service_manager.py::confirm_replacement()
ticket = get_ticket_by_id(ticket_id)
if ticket['status'] == 'PENDING':
    reserve_stock(...)  # <- Happens on confirm
```

**New (for call-center tickets):**
```python
# call_center_api.py::leader_approve()
# BEFORE _create_ticket_and_items():

if call_type in ['replacement', 'maintenance', 'return']:
    # Reserve stock first
    reservation_ids = []
    for item in items:
        if item['direction'] == 'send':
            res_id = reserve_stock(item['item_id'], item['quantity'], ...)
            reservation_ids.append(res_id)
    
    # Store reservation_ids to link to ticket

# Create ticket with status='CONFIRMED'
ticket_id = _create_ticket_and_items(
    data={...,'status': 'CONFIRMED', 'source': 'call_center'},
    reservation_ids=reservation_ids  # Link stock
)
```

**Why:** Can't rely on confirm_replacement() because ticket already starts CONFIRMED.

#### D. Modify `_create_ticket_and_items()` to accept initial status

**Change signature:**
```python
def _create_ticket_and_items(
    data,
    items,
    original_tracking=None,
    new_tracking_send=None,
    new_tracking_receive=None,
    initial_status='PENDING',  # <- NEW: default PENDING for hub, CONFIRMED for call-center
    reservation_ids=None        # <- NEW: pre-created stock reservations
):
```

**Usage:**
- Hub-direct tickets: `initial_status='PENDING'` (current behavior)
- Call-center tickets: `initial_status='CONFIRMED'`

---

### 3. Frontend: LeaderApprovalModal component

**File:** `front/src/components/leader/LeaderApprovalModal.jsx`

**Props:**
```jsx
<LeaderApprovalModal
  order={order}                    // From pending queue
  onApprove={() => refetchQueue()} // Refresh after success
  onClose={() => setModalOpen(false)}
/>
```

**Sections (all in one modal):**

1. **Header**
   - Title: "مراجعة وتأكيد الطلب #{order_id}"
   - Subtitle: Order date, call type badge

2. **Validation summary**
   - Green checkmarks for complete fields
   - Red alerts for missing fields
   - "يجب ملء جميع الحقول المطلوبة قبل التأكيد"

3. **Customer section**
   - Name (editable, red if empty)
   - Phone (editable, format validation)
   - Governorate (dropdown)
   - City (dropdown, filtered by governorate)
   - Address (textarea)

4. **Original tracking section** (collapsible, only if Bosta orders exist)
   - List of Bosta orders from agent session
   - Selected tracking shown as blue chip
   - Can change selection

5. **Items section**
   - Table: SKU, Name, Quantity, Direction (send/receive), Condition
   - **Read-only** (if wrong, leader rejects and asks agent to fix)
   - Validation indicator: ✅ Meets requirements for call type

6. **New tracking section** (dynamic by call type)
   - Replacement: `new_tracking_send` + `new_tracking_receive`
   - Maintenance: `new_tracking_receive`
   - Return: `new_tracking_receive`
   - Sell: `new_tracking_send` (optional)
   - Real-time uniqueness check on blur

7. **Cost section**
   - COD amount (editable, must != 0)
   - تحصيل/استرداد toggle
   - Optional cost_adjustment field

8. **Notes section**
   - Description (editable, min 10 chars)
   - Notes (editable, must not be empty)

9. **Footer**
   - "رفض" button (reject, opens rejection modal)
   - "طلب معلومات" button (request info from agent)
   - **"تأكيد وإنشاء التذكرة"** button (validates + submits)

**Validation on submit:**
- Frontend validates all fields
- If any fail: show alert at top, block submit
- If pass: POST to `/api/call-center/orders/{id}/leader-approve`

---

### 4. UI changes for hub team

#### A. Add source badge to tickets

**ServiceActionCard.jsx:**
```jsx
{ticket.source === 'call_center' && (
  <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
    Call Center
  </span>
)}
```

#### B. Update "انتظار" tab

**Option 1 (safer):** Rename to "انتظار تأكيد الهاب" (Hub Pending Confirmation)
- Makes clear it's for hub-direct tickets only
- Call-center tickets appear in "مؤكد" tab

**Option 2:** Remove tab entirely if call-center becomes primary path

#### C. Add filter by source

**ServiceActionsPage.jsx:**
```jsx
<FilterChip
  label="Call Center"
  active={filters.source === 'call_center'}
  onClick={() => setFilters({...filters, source: 'call_center'})}
/>
```

---

## Implementation plan

### Phase 1: Backend foundation (Critical, ship first)

**WELD mission:**
1. ✅ Migration: Add `source`, `approved_by`, `approved_at` to `service_tickets`
2. ✅ Modify `_create_ticket_and_items()` to accept `initial_status` parameter
3. ✅ Move stock reservation into `leader_approve()` (before ticket creation)
4. ✅ Add validation to `leader_approve()` endpoint (all required fields)
5. ✅ Test: Create call-center ticket with status=CONFIRMED, verify stock reserved

**Files:**
- `migrations/005_add_ticket_source_and_approval.sql`
- `app/services/service_manager.py` (modify `_create_ticket_and_items`)
- `app/api/call_center_api.py` (enhance `leader_approve`)

**Test:**
```bash
# Create ticket via enhanced leader-approve
curl -X POST http://localhost:5050/api/call-center/orders/123/leader-approve \
  -H "Content-Type: application/json" \
  -d '{
    "customer": {...},
    "items": [...],
    "new_tracking_send": "HVR-TEST-001",
    "cod_amount": 500,
    ...
  }'

# Verify:
# - Ticket created with status='CONFIRMED'
# - source='call_center'
# - Stock reserved for send items
# - approved_by set to user_id
```

### Phase 2: LeaderApprovalModal frontend (ships after Phase 1)

**WELD mission:**
1. ✅ Create `LeaderApprovalModal.jsx` component
2. ✅ Build all 6 validation sections
3. ✅ Add real-time tracking uniqueness check
4. ✅ Frontend validation before submit
5. ✅ Integrate into LeaderPendingOrdersPage

**Files:**
- `front/src/components/leader/LeaderApprovalModal.jsx`
- `front/src/components/leader/LeaderPendingOrdersPage.jsx` (add modal trigger)
- `front/src/api/callCenterAPI.js` (add `leaderApproveWithValidation` function)

### Phase 3: UI polish (ships after Phase 2)

**WELD mission:**
1. ✅ Add source badge to ServiceActionCard
2. ✅ Rename "انتظار" tab or remove
3. ✅ Add source filter to ServiceActionsPage
4. ✅ Update list_pending_sell_tickets_html.py query (if used)

---

## Risks + mitigations

| Risk | Grade | Mitigation |
|------|-------|------------|
| **Stock reservation breaks** | Critical | Move reserve into `leader_approve()` before ticket creation |
| **Hub team confusion** | Significant | Add `source` badge, training: "Call Center tickets pre-validated" |
| **"انتظار" tab misleading** | Significant | Rename to "انتظار تأكيد الهاب" or remove |
| **Reports assume PENDING** | Critical | Update `list_pending_sell_tickets_html.py` query |
| **Tracking uniqueness typo** | Monitor | Real-time validation on blur, show green/red indicator |

---

## Success metrics

**Day 1:**
- ✅ Leader can approve order via modal
- ✅ Ticket created with status='CONFIRMED'
- ✅ Stock reserved correctly
- ✅ No PENDING call-center tickets in DB

**Week 1:**
- ✅ Hub team recognizes call-center tickets (source badge)
- ✅ No stock oversell incidents
- ✅ Leader approval time < 2 min (vs 30 sec one-click, but better data quality)

**Month 1:**
- ✅ Hub ticket reject rate < 5% (currently ~15% due to incomplete data)
- ✅ Zero tickets with missing customer/tracking/COD

---

## Open questions

1. **What if leader closes modal mid-edit?**
   - Save draft to `sessionStorage`, restore on reopen?

2. **Can leader edit items, or read-only?**
   - **HELM decision:** Read-only. If wrong, reject and ask agent to fix. Safer.

3. **What about direct hub ticket creation?**
   - Keep starting at PENDING. `source='hub'` distinguishes it.

4. **Migration timing?**
   - Run `005_add_ticket_source_and_approval.sql` during low-traffic window.
   - Existing tickets: `source=NULL` → defaults to 'hub' in queries.

---

## Next action

**HELM orders:** Start Phase 1 (backend foundation). Don't build modal until stock reservation proven safe in test environment.

**Who ships:** Backend dev (Kariem) Phase 1 → Frontend dev Phase 2 → Both Phase 3.

**Timeline:** Phase 1 = 1-2 days. Phase 2 = 2-3 days. Phase 3 = 1 day. **Total: 5-6 days to ship.**
