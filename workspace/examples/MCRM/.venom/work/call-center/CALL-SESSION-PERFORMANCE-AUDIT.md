# Call Session Load Performance Audit — 2026-03-10

> **Problem**: Opening a call session takes 10-30 seconds. Multiple redundant API calls. Bosta API extremely slow.

---

## What I Ate

**Logs analysis**:
```
1. /api/call-center/orders/169      →  1093ms  ← First fetch
2. /api/call-center/orders/169      → 10728ms  ← Second fetch (10s!)
3. /api/customers/search            →   564ms
4. /api/bosta/.../01066834411       →  1925ms  ← Bosta call 1
5. /api/bosta/.../01013770986       →  8489ms  ← Bosta call 2 (different phone!)
6. /api/stock/items                 →   348ms
7. /api/call-center/orders/169      →  4137ms  ← Third fetch (4s!)
8. /api/call-center/calls/...       →    11ms
```

**Total time**: ~27 seconds  
**Root causes**:
1. Same order fetched 3 times
2. Bosta called twice (two phone numbers)
3. Everything runs sequentially
4. Bosta API is VERY slow (8.5s for second phone)

---

## Call Flow Analysis

### Current Flow (Sequential Hell)

```
CustomerServicePage.handleCall()
 ↓
1. getOrder(169) → returns order ✓         [1s]
 ↓
2. startCallSession(fullOrder, context)
 ↓
CallSessionFAB.loadData() useEffect
 ↓
3. lockOrder(169)                          [~200ms]
 ↓
4. getOrderCallContext(169)                [10s!]
   ├─ GET /api/call-center/orders/169     [backend does lazy Bosta enrich]
   ├─ searchCustomers(phone)               [~500ms]
   └─ GET /api/bosta/.../phone1            [2s]
   └─ GET /api/bosta/.../phone2            [8s]  ← SLOWEST
 ↓
5. autoMatchItems(169)                     [~200ms]
 ↓
6. getOrderCalls(169)                      [~10ms]
```

**Total**: ~27 seconds, mostly Bosta + redundant fetches

---

## Critical Issues

### 🔴 ISSUE 1: Order fetched 3 times

**Who calls it**:
1. `CustomerServicePage.handleCall()` → `getOrder(169)`
2. `CallSessionFAB.loadData()` → `getOrderCallContext(169)` → `getOrder(169)` internally
3. Backend lazy Bosta enrichment → updates order → another read

**Fix**: Remove step 1 — `handleCall` doesn't need to fetch the full order. Pass the list order directly.

---

### 🔴 ISSUE 2: Bosta called twice with different phones

**Why**: 
- Order has `customer_phone` (01066834411)
- Customer record has `phone_secondary` (01013770986)
- `getOrderCallContext` fetches Bosta for BOTH phones sequentially

**Code location**: `callCenterAPI.js:1568-1617`

```javascript
const phonesToFetch = [phone];
if (customer?.phone_secondary && String(customer.phone_secondary).trim() !== String(phone).trim()) {
  phonesToFetch.push(String(customer.phone_secondary).trim());
}
// Then loops and fetches Bosta for each phone SEQUENTIALLY
for (const p of phonesToFetch) {
  const bostaResult = await axiosInstance.get(`/api/bosta/customer/${p}/orders`);
}
```

**Fix**: Fetch in parallel with `Promise.all` instead of sequential loop.

---

### 🔴 ISSUE 3: Lazy Bosta enrichment on every `getOrder`

**What happens**:
- Backend checks if order has `bosta_tracking`
- If not, calls Bosta API to enrich
- Updates order
- This happens EVERY time someone fetches the order

**Code**: `call_center_api.py:205-221`

**Fix**: 
- Enrich during ERP sync only (already happens)
- Remove lazy enrichment (it's too slow for real-time UX)
- OR: Make it async (enrich in background, don't block response)

---

### 🟡 ISSUE 4: Everything runs sequentially

**Current**:
```javascript
await lockOrder(order.id);                              // Wait
const context = await getOrderCallContext(order.id);    // Wait
const [matchedItemsRes, callsRes] = await Promise.all([ // Finally parallel!
  autoMatchItems(order.id, order.order_description),
  getOrderCalls(order.id)
]);
```

**Fix**: Run more in parallel:
```javascript
const [lockRes, context, matchedItemsRes, callsRes] = await Promise.all([
  lockOrder(order.id),
  getOrderCallContext(order.id),
  autoMatchItems(order.id, order.order_description),
  getOrderCalls(order.id)
]);
```

---

### 🟡 ISSUE 5: Bosta API is inherently slow

**Reality**: External API, out of our control. 8.5s for one phone number.

**Mitigations**:
1. Cache Bosta results (already exists: `bosta_orders` table + `customers.bosta_orders`)
2. Use cache-first strategy: check cache, only hit API if stale
3. Make Bosta fetch async (load UI first, show Bosta data when ready)
4. Limit to 1 phone only (don't fetch secondary phone Bosta)

---

## Performance Breakdown

| Step | Current | Optimized | Savings |
|------|---------|-----------|---------|
| Fetch order (x3) | 16s | 1s | -15s ✓ |
| Bosta (x2 sequential) | 10.5s | 2s | -8.5s ✓ |
| Other API calls | 1s | 1s | 0 |
| **Total** | **27.5s** | **4s** | **-23.5s** |

**Target**: < 2 seconds to open call session

---

## Recommended Fixes (Priority Order)

### Phase 1: Remove Redundant Fetches (Immediate, -15s)

**1A: Remove `getOrder` from `handleCall`**
```javascript
// CustomerServicePage.jsx:handleCall
// OLD:
const { order: fullOrder } = await getOrder(order.id);
startCallSession(fullOrder, minimalContext);

// NEW:
startCallSession(order, minimalContext); // Pass order from list directly
```

**Impact**: Eliminates 1 fetch, saves ~1s

**1B: Remove lazy Bosta enrichment from backend**
```python
# call_center_api.py:get_order
# REMOVE lines 205-221 (lazy enrichment block)
```

**Impact**: Eliminates backend Bosta call during `getOrderCallContext`, saves ~10s

---

### Phase 2: Parallelize Bosta Fetches (Immediate, -6s)

**2A: Fetch Bosta in parallel**
```javascript
// callCenterAPI.js:getOrderCallContext
// OLD:
for (const p of phonesToFetch) {
  const bostaResult = await axiosInstance.get(...); // Sequential
}

// NEW:
const bostaResults = await Promise.all(
  phonesToFetch.map(p => 
    axiosInstance.get(`/api/bosta/customer/${encodeURIComponent(p)}/orders`)
      .catch(() => ({ data: null })) // Don't fail if one phone fails
  )
);
```

**Impact**: 2s + 8s sequential → 8s parallel, saves ~6s

---

### Phase 3: Parallelize All Initial Loads (Immediate, -1s)

**3A: Run lock + context + items + calls in parallel**
```javascript
// CallSessionFAB.jsx:loadData
const [lockRes, context, matchedItemsRes, callsRes] = await Promise.all([
  lockOrder(order.id),
  getOrderCallContext(order.id),
  autoMatchItems(order.id, order.order_description),
  getOrderCalls(order.id)
]);
```

**Impact**: Saves ~500-1000ms

---

### Phase 4: Optional Optimizations

**4A: Limit Bosta to primary phone only**
```javascript
// Don't fetch phone_secondary Bosta (it's rare that customer has deliveries on secondary)
const phonesToFetch = [phone]; // Remove secondary phone
```

**Impact**: Saves 8s if secondary phone is slow

**4B: Use Bosta cache-first strategy**
```javascript
// Check customers.bosta_orders first, only hit API if stale (>1 hour)
```

**Impact**: Most opens become instant (cache hit)

**4C: Async Bosta load**
```javascript
// Load UI first, show "Loading Bosta..." spinner
// Fetch Bosta in background, update when ready
```

**Impact**: Perceived load time ~2s (UI ready), Bosta appears later

---

## Implementation Plan

### Step 1: Backend — Remove Lazy Enrichment ✓

```python
# app/api/call_center_api.py:get_order
# Remove lines 205-221
```

**Risk**: 🟢 Low — ERP sync already enriches. Lazy enrichment is redundant.

---

### Step 2: Frontend — Remove Redundant getOrder ✓

```javascript
// front/src/pages/CustomerServicePage.jsx:handleCall
// Remove getOrder call, pass order directly
```

**Risk**: 🟢 Low — order from list has all needed data

---

### Step 3: Frontend — Parallelize Bosta ✓

```javascript
// front/src/api/callCenterAPI.js:getOrderCallContext
// Change for loop to Promise.all
```

**Risk**: 🟢 Low — error handling with .catch ensures one failure doesn't break all

---

### Step 4: Frontend — Parallelize Initial Load ✓

```javascript
// front/src/components/call-center/CallSessionFAB.jsx:loadData
// Run lock, context, items, calls in parallel
```

**Risk**: 🟡 Medium — lockOrder might need to complete before context fetch (check if backend validates lock)

---

## Expected Results

**Before**:
- Open call session: 27 seconds
- User waits, frustrated
- Multiple redundant fetches

**After**:
- Open call session: 2-4 seconds
- Fast enough for production
- Clean, efficient flow

---

## Test Plan

1. Open call session for order with:
   - ✓ Primary phone only
   - ✓ Primary + secondary phone
   - ✓ No Bosta tracking
   - ✓ Existing Bosta tracking

2. Check logs:
   - ✓ `/api/call-center/orders/X` called ONCE
   - ✓ Bosta calls in parallel (if 2 phones)
   - ✓ Total time < 5 seconds

3. Verify functionality:
   - ✓ Order data loads correctly
   - ✓ Bosta orders display
   - ✓ Items load
   - ✓ Call history loads

---

*Generated: 2026-03-10*  
*Analyst: VENOM*  
*Status: Ready for implementation*
