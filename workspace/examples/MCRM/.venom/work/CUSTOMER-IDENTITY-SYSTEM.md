# Customer Identity System — Complete Guide

**When phone/name/secondary changes, how does the system keep everything unified with no duplicates and no lost history?**

---

## 1. Where Can Customer Data Be Edited? (UI Entry Points)

### A. ServiceModalViewer → CustomerCard
**Path:** Ticket modal → Customer/Location section → Edit customer details  
**What can change:** Name, Primary Phone, Secondary Phone  
**API Call:** `PUT /api/customers/:id` via `customerAPI.updateCustomer()`  
**Used in:** Service ticket workflows when viewing customer profile

### B. CallSessionFAB → CustomerCard  
**Path:** Call center FAB → Profile section → Edit customer details  
**What can change:** Name, Primary Phone, Secondary Phone  
**API Call:** `PUT /api/customers/:id` via `customerAPI.updateCustomer()`  
**Used in:** Active call sessions

### C. BostaIdentityPanel → CustomerCard
**Path:** Bosta search result → Customer identity panel → Edit  
**What can change:** Name, Primary Phone, Secondary Phone  
**API Call:** `PUT /api/customers/:id` via `customerAPI.updateCustomer()`  
**Used in:** When creating tickets from Bosta orders

### D. Direct API Usage
**Paths:**
- `POST /api/customers/` — Create new customer
- `PUT /api/customers/:id` — Update existing customer
- Bosta sync via `bosta_service.sync_customer_data()`

---

## 2. What Happens When You Change a Phone Number?

### Backend Flow (`PUT /api/customers/:id`)

```
1. VALIDATE
   ├─ Check if new primary phone belongs to another customer
   ├─ Check if new secondary phone is another customer's primary
   └─ Check primary ≠ secondary on same row

2. DETECT CONFLICT
   └─ If new primary phone = another customer's phone:
      ├─ **MERGE** that customer into this one (merge_customer_into)
      └─ Keep THIS customer_id as surviving identity

3. UPDATE
   └─ Apply changes to customers table

4. SYNC DENORMALIZED FIELDS
   ├─ calls.customer_phone (for phone-based history)
   ├─ orders.customer_phone (for search/display)
   ├─ orders.customer_name (for display)
   └─ Reassign calls via order/ticket links (catches stragglers)
```

### What Gets Updated Across the System?

#### **customers table** (primary record)
```sql
UPDATE customers 
SET phone = '01220991000', 
    name = 'ام محمد',
    phone_secondary = '...',
    updated_by = 'api_update'
WHERE id = 123
```

#### **service_tickets** (FK → customer_id)
```sql
-- Already linked by customer_id, no update needed
-- BUT: if merge happened, source tickets moved to target customer_id
UPDATE service_tickets 
SET customer_id = target_customer_id 
WHERE customer_id = source_customer_id
```

#### **orders** (FK + denormalized fields)
```sql
-- Move orders if merge happened
UPDATE orders 
SET customer_id = target_customer_id 
WHERE customer_id = source_customer_id

-- Sync denormalized phone/name for display
UPDATE orders 
SET customer_phone = '01220991000',
    customer_name = 'ام محمد'
WHERE customer_id = 123
  OR customer_phone IN ('01220991001', '01220991000')
```

#### **calls** (denormalized customer_phone)
```sql
-- Direct phone update
UPDATE calls 
SET customer_phone = '01220991000'
WHERE customer_phone IN ('01220991001', '01220991000')

-- Link-based reassignment (NEW — catches stragglers)
UPDATE calls c
INNER JOIN orders o ON o.id = c.linked_to_order_id
SET c.customer_phone = '01220991000'
WHERE o.customer_id = 123

UPDATE calls c
INNER JOIN service_tickets st ON st.id = c.linked_to_ticket_id
SET c.customer_phone = '01220991000'
WHERE st.customer_id = 123
```

---

## 3. How Does Merge Work? (No Duplicates)

### When Does Merge Happen?
**Scenario:** Customer A has phone `01220991001`. You change it to `01220991000`, but Customer B already has `01220991000` as their primary phone.

**Old behavior:** MySQL `1062` error (duplicate key violation) → 500 error  
**New behavior:** Detect conflict → **merge B into A** → A keeps its ID, B is deleted

### Merge Steps (`merge_customer_into`)

```python
def merge_customer_into(target_customer_id, source_customer_id, target_phone, target_name):
    """
    Merge source customer into target customer.
    Target survives with its customer_id.
    Source is deleted after moving all references.
    """
    with transaction():
        # 1. Move FK references
        UPDATE service_tickets SET customer_id = target WHERE customer_id = source
        UPDATE orders SET customer_id = target WHERE customer_id = source
        
        # 2. Normalize phone-based history
        UPDATE calls SET customer_phone = final_phone 
        WHERE customer_phone IN (old_target_phone, old_source_phone, final_phone)
        
        UPDATE orders SET customer_phone = final_phone 
        WHERE customer_id = target OR customer_phone IN (...)
        
        # 3. Link-based call reassignment (NEW)
        UPDATE calls c INNER JOIN orders o ON o.id = c.linked_to_order_id
        SET c.customer_phone = final_phone WHERE o.customer_id = target
        
        UPDATE calls c INNER JOIN service_tickets st ON st.id = c.linked_to_ticket_id
        SET c.customer_phone = final_phone WHERE st.customer_id = target
        
        # 4. Merge profile fields (keep target, fill gaps from source)
        UPDATE customers SET 
            name = final_name,
            phone = final_phone,
            governorate = COALESCE(target.governorate, source.governorate),
            city = COALESCE(target.city, source.city),
            address_details = COALESCE(target.address_details, source.address_details)
        WHERE id = target
        
        # 5. Delete source customer
        DELETE FROM customers WHERE id = source
        
        # 6. Rebuild customer_services JSON
        update_customer_services(target)
```

---

## 4. How Does Call History Stay Unified?

### Problem We Solved
**Before:** Call history loaded with `WHERE customer_phone = '01220991000'`  
**Issue:** After phone change, some calls still had old phone string → history split

### Solution (NEW Implementation)

#### Backend: List calls by customer_id + phone
```python
def get_calls_for_customer(customer_id=None, phone=None, limit=50):
    """
    360° call history: phone match OR calls linked to customer's orders/tickets.
    """
    WHERE (
        customer_phone = normalized_phone
        OR linked_to_order_id IN (SELECT id FROM orders WHERE customer_id = ?)
        OR linked_to_ticket_id IN (SELECT id FROM service_tickets WHERE customer_id = ?)
    )
```

#### Frontend: Pass customer_id to CallHistoryCard
```jsx
<CallHistoryCard 
  phone={customer.phone} 
  customerId={customer.id}  // NEW
/>
```

```js
// callCenterAPI.js
export const getCallsByPhone = async (phone, options = {}) => {
  const customerId = options?.customerId;
  const params = {};
  if (phone) params.customer_phone = phone;
  if (customerId) params.customer_id = customerId;
  
  // GET /api/call-center/calls?customer_phone=X&customer_id=Y
  // Backend returns union of both criteria
}
```

**Result:** Even if `calls.customer_phone` still has old strings, the link-based query catches them via orders/tickets → **unified history**.

---

## 5. Duplicate Prevention Strategy

### A. On Create (`POST /api/customers/`)
```
1. Normalize phone to 01XXXXXXXXX
2. Check if phone exists: get_customer_by_phone(normalized_phone)
3. If exists:
   └─ Return 409 with { code: "duplicate_phone", existing_customer: {...} }
4. Else:
   └─ Create new customer
```

**Frontend:** `createOrGetCustomer()` catches 409 → returns existing customer as "deduplicated match"

### B. On Update (`PUT /api/customers/:id`)
```
1. Normalize phone
2. Check if new phone belongs to another customer: get_customer_primary_phone_conflict()
3. If conflict:
   └─ MERGE that customer into this one (merge_customer_into)
4. Else:
   └─ Normal UPDATE
5. Sync denormalized fields (sync_customer_identity_references)
6. Catch MySQL 1062 (race condition) → return 409
```

### C. All Customer Creation Paths Use Dedup

**Paths using `createOrGetCustomer()` (no duplicates):**
- ✅ `CallSessionFAB` → New customer from call center
- ✅ `useServiceCreation` → New customer when creating ticket
- ✅ `callCenterAPI.erpSyncCustomer()` → ERP sync
- ✅ `bosta_service.sync_customer_data()` → Bosta sync (uses `upsert_customer_bosta_data`)

**What still needs checking:**
- Any direct `customerAPI.createCustomer()` calls (should use `createOrGetCustomer` instead)
- Manual SQL inserts (shouldn't exist in production code)

---

## 6. Database Schema — Customer Identity Fields

### customers
```sql
CREATE TABLE customers (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255),
  phone VARCHAR(20) UNIQUE NOT NULL,  -- Normalized 01XXXXXXXXX
  phone_secondary VARCHAR(20),
  governorate VARCHAR(100),
  city VARCHAR(100),
  address_details TEXT,
  bosta_orders JSON,
  customer_services JSON,
  created_by VARCHAR(50),
  updated_by VARCHAR(50),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### service_tickets
```sql
CREATE TABLE service_tickets (
  id INT PRIMARY KEY,
  customer_id INT,  -- FK to customers.id
  ticket_number VARCHAR(50),
  phone VARCHAR(20),  -- Denormalized (display only)
  customer_name VARCHAR(255),  -- Denormalized (display only)
  ...
  FOREIGN KEY (customer_id) REFERENCES customers(id)
)
```

### orders
```sql
CREATE TABLE orders (
  id INT PRIMARY KEY,
  customer_id INT,  -- FK to customers.id
  customer_phone VARCHAR(20),  -- Denormalized (search/display)
  customer_name VARCHAR(255),  -- Denormalized (display)
  ...
  FOREIGN KEY (customer_id) REFERENCES customers(id)
)
```

### calls
```sql
CREATE TABLE calls (
  id INT PRIMARY KEY,
  linked_to_order_id INT,  -- FK to orders.id (nullable)
  linked_to_ticket_id INT,  -- FK to service_tickets.id (nullable)
  customer_phone VARCHAR(20),  -- Denormalized (history lookup)
  agent_id INT,
  agent_name VARCHAR(255),
  status VARCHAR(50),
  notes TEXT,
  ...
)
```

**Key insight:** `calls` has NO `customer_id` FK. History relies on:
- `customer_phone` (denormalized string)
- **NEW:** Link-based queries via `linked_to_order_id` / `linked_to_ticket_id` → `customer_id`

---

## 7. Testing Checklist

### Scenario 1: Change Primary Phone (No Conflict)
1. Customer A: `01220991001`, has 2 tickets, 3 orders, 5 calls
2. Change phone to `01220991000` (no other customer has this)
3. **Expected:**
   - ✅ `customers.phone` = `01220991000`
   - ✅ All tickets still link to same `customer_id`
   - ✅ All orders have `customer_phone` = `01220991000`
   - ✅ All calls have `customer_phone` = `01220991000`
   - ✅ Call history shows all 5 calls under new number
   - ✅ No duplicate customer rows

### Scenario 2: Change Primary Phone (Merge Conflict)
1. Customer A: `01220991001`, has ticket #1
2. Customer B: `01220991000`, has ticket #2
3. Change A's phone to `01220991000`
4. **Expected:**
   - ✅ B is deleted
   - ✅ A survives with phone `01220991000`
   - ✅ Ticket #1 still on A's `customer_id`
   - ✅ Ticket #2 moved to A's `customer_id`
   - ✅ Call history for A shows calls from both A and B
   - ✅ Only 1 customer row remains

### Scenario 3: Change Name
1. Customer A: name "ام محمد", has 3 orders
2. Change name to "أم محمد احمد"
3. **Expected:**
   - ✅ `customers.name` = "أم محمد احمد"
   - ✅ All orders have `customer_name` = "أم محمد احمد"
   - ✅ No duplicate customers

### Scenario 4: Change Secondary Phone
1. Customer A: secondary `01220991002`
2. Change to `01220991003`
3. **Expected:**
   - ✅ `customers.phone_secondary` = `01220991003`
   - ✅ Cannot set secondary = another customer's primary (blocked)
   - ✅ Cannot set secondary = own primary (blocked)

### Scenario 5: Create Customer (Duplicate Phone)
1. Customer A exists: `01220991000`
2. Try to create new customer with `01220991000`
3. **Expected:**
   - ✅ Backend returns 409 with `existing_customer`
   - ✅ Frontend `createOrGetCustomer()` returns existing customer
   - ✅ No duplicate created
   - ✅ UI proceeds with existing customer

### Scenario 6: Search Old Number After Change
1. Customer A had `01220991001`, changed to `01220991000`
2. Search for `01220991001`
3. **Expected:**
   - ⚠️ **Will NOT find** customer (phone no longer matches)
   - **Why:** We don't keep phone history table
   - **Workaround:** Search by name or new number

---

## 8. Known Gaps & Edge Cases

### Gap 1: Phone History Not Searchable
**Issue:** After changing phone `01220991001` → `01220991000`, searching for old number finds nothing.  
**Why:** We only store current phone, not history.  
**Fix Options:**
- Add `phone_history` JSON field to customers
- Create `customer_phone_history` table
- Accept as expected behavior (search by name or current number)

### Gap 2: Race Condition on Concurrent Updates
**Issue:** Two users editing same customer simultaneously could create inconsistent state.  
**Mitigation:** Transaction locks in `merge_customer_into`, but UI doesn't have optimistic locking.  
**Fix Options:**
- Add `version` field for optimistic locking
- Show warning "Customer was modified by another user"

### Gap 3: Calls Without Order/Ticket Link
**Issue:** ASK-only calls (`call_type='ask'`) have no `linked_to_order_id` or `linked_to_ticket_id`.  
**Impact:** If phone changes, these calls only found if `customer_phone` string was updated.  
**Current Fix:** `sync_customer_identity_references` updates `calls.customer_phone` for old+new phone.  
**Better Fix:** Add `customer_id` FK to calls table (schema change).

### Gap 4: Bosta Sync May Create Duplicates
**Issue:** `bosta_service.sync_customer_data()` uses `upsert_customer_bosta_data` which creates new customer if phone not found.  
**Risk:** If phone normalization differs, could create duplicate.  
**Mitigation:** Both use `normalize_phone_safe()`, but edge cases possible.  
**Fix:** Use `createOrGetCustomer` path in Bosta sync.

---

## 9. Summary — How It All Works Together

```
USER CHANGES PHONE
     ↓
CustomerCard.handleSave()
     ↓
customerAPI.updateCustomer(id, { phone: newPhone })
     ↓
PUT /api/customers/:id
     ↓
┌─────────────────────────────────────────┐
│  1. Validate new phone                  │
│  2. Check for primary phone conflict    │
│  3. If conflict → MERGE                 │
│  4. UPDATE customers table              │
│  5. Sync denormalized fields:           │
│     - calls.customer_phone              │
│     - orders.customer_phone             │
│     - orders.customer_name              │
│  6. Reassign calls via order/ticket     │
│  7. Rebuild customer_services JSON      │
└─────────────────────────────────────────┘
     ↓
RESULT:
- ✅ One customer row (no duplicates)
- ✅ All tickets linked to customer_id
- ✅ All orders updated
- ✅ All calls unified (phone + link-based)
- ✅ Call history shows complete history
- ✅ No data loss
```

---

## 10. Code References

**Backend:**
- `app/models/customer.py` — Core customer logic
  - `merge_customer_into()` — Merge duplicate customers
  - `sync_customer_identity_references()` — Sync denormalized fields
  - `_reassign_calls_customer_phone_via_links()` — NEW link-based call update
  - `get_customer_primary_phone_conflict()` — Detect conflicts

- `app/models/call.py`
  - `get_calls_for_customer()` — NEW customer_id + phone query
  - `get_calls_by_customer_phone()` — Wrapper for phone-only

- `app/api/customer_api.py`
  - `POST /api/customers/` — Create (409 on duplicate)
  - `PUT /api/customers/:id` — Update (merge on conflict)

- `app/api/call_center_api.py`
  - `GET /api/call-center/calls?customer_phone=X&customer_id=Y`

**Frontend:**
- `front/src/api/customerAPI.js`
  - `createOrGetCustomer()` — Dedup-aware create
  - `updateCustomer()` — Update wrapper

- `front/src/api/callCenterAPI.js`
  - `getCallsByPhone(phone, { customerId })` — NEW customer_id support

- `front/src/components/modals/ServiceModalViewer/CallHistoryCard.jsx`
  - Accepts `customerId` prop
  - Fetches by phone + customer_id

- `front/src/components/modals/ServiceModalViewer/CustomerCard.jsx`
  - Edit UI for customer details
  - Used in ServiceModalViewer, CallSessionFAB, BostaIdentityPanel

---

## 11. What We Just Implemented (This Session)

### ✅ Backend Changes
1. **Link-based call reassignment** (`_reassign_calls_customer_phone_via_links`)
   - Updates `calls.customer_phone` by joining through `orders.customer_id` and `service_tickets.customer_id`
   - Catches calls whose denormalized phone never matched the old normalized string

2. **Customer-scoped call listing** (`get_calls_for_customer`)
   - Accepts `customer_id` + `phone`
   - Returns union: `customer_phone` match OR linked via orders/tickets
   - API endpoint accepts both params: `GET /api/call-center/calls?customer_phone=X&customer_id=Y`

### ✅ Frontend Changes
1. **CallHistoryCard accepts customerId**
   - Prop: `customerId` (optional)
   - Passes to `getCallsByPhone(phone, { customerId })`

2. **All CallHistoryCard usages updated**
   - `ServiceModalViewer` → passes `customerProfile?.id ?? ticket?.customer_id`
   - `BostaIdentityPanel` → passes `customerData.id`
   - `CallSessionFAB` → passes `customer?.id ?? order?.customer_id`

### 🎯 Result
**Before:** Call history only matched exact `customer_phone` string → split after phone change  
**After:** Call history includes all calls linked to customer's orders/tickets → unified even if denormalized phone drifts

---

**Last Updated:** 2026-04-04  
**Status:** ✅ Implemented and tested (backend restarted, frontend needs refresh)
