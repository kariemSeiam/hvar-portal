# Call Center Complete Audit — 2026-03-10

> **User Request**: "Fix everything in call center. Filters not working. No answer button disappears. Make perfect."

---

## Critical Issues Found

### 🔴 ISSUE 1: Filters Are Client-Side Only (Not Sent to Backend)

**Problem**:
- SearchBar has status filters (جديد, مجدول, لم يرد) and attempt filters (0, 1, 2, 3+)
- These filters are applied **client-side** in `useMemo` (CustomerServicePage.jsx:470-503)
- Backend `list_orders` API doesn't receive these filters
- Result: All orders are fetched, then filtered locally
- Performance: If 1000 orders exist, all 1000 are fetched even if user filters to 10

**Current Flow**:
```javascript
// CustomerServicePage.jsx:72-112
const fetchOrders = useCallback(async () => {
  const params = {
    status: activeTab === 'all' ? undefined : activeTab, // ← Only tab status, not filter status
    today: todayStr,
    page,
    limit: 25
  };
  // NO statusFilters or attemptFilters sent to backend!
  const [ordersResponse] = await Promise.all([listOrders(params)]);
  setOrders(ordersResponse.data);
}, [activeTab, selectedDate, searchQuery, page]); // ← Missing statusFilters, attemptFilters

// Later, client-side filter (lines 470-503):
const filteredOrders = useMemo(() => {
  return orders.filter(order => {
    if (statusFilters.length > 0) { // ← Client-side only!
      const matches = statusFilters.some(...);
      if (!matches) return false;
    }
    if (attemptFilters.length > 0) { // ← Client-side only!
      const matches = attemptFilters.some(...);
      if (!matches) return false;
    }
    return true;
  });
}, [orders, activeTab, statusFilters, attemptFilters]);
```

**Fix**: Send filters to backend, apply in SQL WHERE clause.

---

### 🔴 ISSUE 2: "No Answer" (لم يرد) Is Not a Real Status

**Problem**:
- Database has statuses: `new`, `scheduled`, `confirmed`, `converted`, `canceled`
- "لم يرد" (no_answer) is **derived**: `status='new' AND attempt_count > 0`
- SearchBar offers "لم يرد" as a filter option (line 57)
- Backend doesn't understand `status='no_answer'`
- Frontend tries to filter locally but this is confusing

**Current**:
```javascript
// SearchBar.jsx:57
{ value: 'no_answer', label: 'لم يرد', color: 'amber' }

// CustomerServicePage.jsx:477-479
if (s === 'no_answer') {
  return order.status === 'new' && (order.attempt_count || 0) > 0;
}
```

**Options**:
1. **Backend adds virtual "no_answer" status**: When `status='no_answer'` requested, backend queries `status='new' AND attempt_count > 0`
2. **Frontend sends explicit query**: `status=new&min_attempts=1`
3. **Remove "لم يرد" from filters**: Keep it as a derived display only, not a filter

**Recommendation**: Option 1 (backend handles it).

---

### 🔴 ISSUE 3: "لم يرد" Button in CallSessionFAB Doesn't Show for All Call Types

**Problem**:
- User says "لم يرد button disappears"
- CallSessionFAB shows "لم يرد" button (line 1765-1772)
- But button is conditional — might be hidden based on order state or permissions

**Need to verify**: What conditions hide the button?

---

### 🔴 ISSUE 4: Attempt Filters Not Applied Correctly

**Problem**:
- Attempt filters (0, 1, 2, 3+) are client-side only
- Backend doesn't support `min_attempts` or `max_attempts` query params
- Large orders lists → poor performance

**Fix**: Add backend support for attempt filtering.

---

### 🟡 ISSUE 5: Status Filters Don't Persist After fetchOrders

**Problem**:
- User selects filters → `fetchOrders` runs → filters are still applied client-side
- But `fetchOrders` doesn't depend on `statusFilters` or `attemptFilters`
- If filters change → orders aren't refetched from backend (because they're not sent anyway)
- This is actually correct for current client-side approach, but confusing

**Fix**: Either send filters to backend OR make it clear filters are client-side.

---

### 🟡 ISSUE 6: Pagination + Client-Side Filters = Broken

**Problem**:
- Backend returns 25 orders per page
- Frontend filters client-side
- Result: User might see 5 orders on page 1 (20 filtered out), but page 2 exists
- Clicking page 2 → fetches next 25 → might all be filtered out → empty page

**Fix**: Backend must apply filters so pagination works correctly.

---

## Architecture Analysis

### Current Flow

```
User clicks filter (لم يرد) in SearchBar
  ↓
setStatusFilters(['no_answer'])
  ↓
useMemo re-runs → filters orders array client-side
  ↓
filteredOrders shown in table
  ↓
Backend never knows about filter!
```

### Correct Flow

```
User clicks filter (لم يرد) in SearchBar
  ↓
setStatusFilters(['no_answer'])
  ↓
useEffect triggers fetchOrders (depends on statusFilters)
  ↓
fetchOrders sends status=no_answer (or status=new&min_attempts=1)
  ↓
Backend applies WHERE clause
  ↓
Returns only matching orders
  ↓
Frontend displays results
```

---

## Root Causes

1. **Filters were added to SearchBar but never wired to backend API**
2. **fetchOrders doesn't depend on statusFilters or attemptFilters**
3. **Backend list_orders doesn't accept attempt_count filters**
4. **"لم يرد" is a virtual status not understood by backend**

---

## Recommended Fixes (Priority Order)

### Phase 1: Wire Filters to Backend ✓

**1A: Update fetchOrders to include filters**

```javascript
// CustomerServicePage.jsx:72
const fetchOrders = useCallback(async () => {
  const params = {
    status: activeTab === 'all' ? undefined : activeTab,
    today: todayStr,
    page,
    limit: 25
  };
  
  // Add status filters (convert no_answer to backend format)
  if (statusFilters.length > 0) {
    const backendStatuses = statusFilters.map(s => {
      if (s === 'no_answer') return 'new'; // Backend will add attempt_count > 0 check
      return s;
    });
    params.statuses = backendStatuses.join(','); // comma-separated
    if (statusFilters.includes('no_answer')) {
      params.min_attempts = 1; // ← New param
    }
  }
  
  // Add attempt filters
  if (attemptFilters.length > 0) {
    params.attempts = attemptFilters.join(','); // e.g. "0,1,2,3"
  }
  
  const [ordersResponse] = await Promise.all([listOrders(params)]);
  setOrders(ordersResponse.data);
}, [activeTab, selectedDate, searchQuery, page, statusFilters, attemptFilters]); // ← Add deps
```

**1B: Add dependencies to useEffect**

```javascript
// CustomerServicePage.jsx:114-131
useEffect(() => {
  if (!selectedDate || hasInitialSynced.current) return;
  // ... (rest unchanged)
}, [selectedDate, fetchOrders]); // fetchOrders already includes filters as deps
```

**1C: Remove client-side filtering**

```javascript
// CustomerServicePage.jsx:470-503
const filteredOrders = useMemo(() => {
  return orders; // No client-side filtering needed!
}, [orders]);
```

---

### Phase 2: Backend Support for Filters ✓

**2A: Update backend list_orders to accept new params**

```python
# app/api/call_center_api.py:66-122
def list_orders():
    status = request.args.get('status')
    statuses = request.args.get('statuses')  # ← NEW: comma-separated
    min_attempts = request.args.get('min_attempts', type=int)  # ← NEW
    attempts = request.args.get('attempts')  # ← NEW: comma-separated "0,1,2,3"
    
    # Convert statuses to list
    status_list = []
    if statuses:
        status_list = [s.strip() for s in statuses.split(',') if s.strip()]
    elif status:
        status_list = [status]
    
    # Convert attempts to list
    attempt_list = []
    if attempts:
        attempt_list = [int(a) for a in attempts.split(',') if a.strip().isdigit()]
    
    rows = order_model.list_orders(
        limit=per_page, offset=offset,
        status_list=status_list,  # ← Pass list instead of single status
        min_attempts=min_attempts,
        attempt_list=attempt_list,  # ← NEW
        search=search, date_from=date_from, date_to=date_to, today=today
    )
```

**2B: Update order_model.list_orders**

```python
# app/models/order.py
def list_orders(self, limit=25, offset=0, status_list=None, min_attempts=None, 
                attempt_list=None, search=None, date_from=None, date_to=None, today=None):
    query = "SELECT * FROM orders WHERE 1=1"
    params = []
    
    # Status filter (multiple)
    if status_list:
        placeholders = ','.join(['%s'] * len(status_list))
        query += f" AND status IN ({placeholders})"
        params.extend(status_list)
    
    # Min attempts (for "لم يرد" filter)
    if min_attempts is not None:
        query += " AND attempt_count >= %s"
        params.append(min_attempts)
    
    # Specific attempt counts (multi-select: 0, 1, 2, 3+)
    if attempt_list:
        # Handle 3+ as >= 3
        exact_attempts = [a for a in attempt_list if a < 3]
        has_3_plus = 3 in attempt_list
        
        conditions = []
        if exact_attempts:
            placeholders = ','.join(['%s'] * len(exact_attempts))
            conditions.append(f"attempt_count IN ({placeholders})")
            params.extend(exact_attempts)
        if has_3_plus:
            conditions.append("attempt_count >= 3")
        
        if conditions:
            query += f" AND ({' OR '.join(conditions)})"
    
    # Date, search, etc. (existing logic)
    # ...
    
    query += " ORDER BY created_at DESC LIMIT %s OFFSET %s"
    params.extend([limit, offset])
    
    return self.execute(query, params)
```

---

### Phase 3: Fix "لم يرد" Button Visibility ✓

**3A: Verify button conditions**

```javascript
// CallSessionFAB.jsx:1765-1772
<button
  onClick={handleNoAnswer}
  disabled={isLoading || !order?.id}  // ← Check these conditions
  className="..."
  aria-label="لم يرد العميل"
>
  <PhoneOff className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
  <span className="text-[10px] sm:text-xs font-bold font-cairo whitespace-nowrap">لم يرد</span>
</button>
```

**3B: Ensure button always shows for pending orders**

Check if there's conditional rendering wrapping the button. If so, remove it or make condition match user expectation.

---

### Phase 4: Add Loading States for Filters ✓

**4A: Show skeleton when filters change**

```javascript
// CustomerServicePage.jsx
useEffect(() => {
  if (statusFilters.length > 0 || attemptFilters.length > 0) {
    setIsLoading(true);
    fetchOrders();
  }
}, [statusFilters, attemptFilters]);
```

---

## Implementation Plan

### Step 1: Frontend - Wire Filters to API ✓

- Update `fetchOrders` to build params from `statusFilters` and `attemptFilters`
- Add `statusFilters` and `attemptFilters` to `fetchOrders` dependencies
- Remove client-side `filteredOrders` logic

**Files**: `CustomerServicePage.jsx`

---

### Step 2: Backend - Add Filter Support ✓

- Update `call_center_api.py:list_orders` to accept `statuses`, `min_attempts`, `attempts` params
- Update `order_model.py:list_orders` to apply SQL WHERE clauses
- Test with: `GET /api/call-center/orders?statuses=new&min_attempts=1` (should return لم يرد orders)

**Files**: `call_center_api.py`, `order.py`

---

### Step 3: Fix "لم يرد" Button ✓

- Read `CallSessionFAB.jsx` fully to find button rendering logic
- Ensure button always shows for orders where agent can take action
- Test: Open order → button should be visible and clickable

**Files**: `CallSessionFAB.jsx`

---

### Step 4: Test All Filters ✓

1. Filter by "جديد" → only new orders
2. Filter by "مجدول" → only scheduled orders
3. Filter by "لم يرد" → only new orders with attempt_count > 0
4. Filter by attempts (0, 1, 2, 3+) → correct counts
5. Combine filters → AND logic works
6. Clear filters → back to all orders

---

## Expected Results

**Before**:
- Filters don't reduce fetched data (all orders fetched)
- Pagination broken with filters (empty pages)
- "لم يرد" filter doesn't work
- Performance poor with large datasets

**After**:
- Filters sent to backend → SQL WHERE clause
- Only matching orders fetched
- Pagination works correctly
- Performance: Fast even with 10k+ orders

---

*Generated: 2026-03-10*  
*Analyst: VENOM*  
*Status: Ready for implementation*
