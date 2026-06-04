# Call Center Refactor — Clean Integration

> **Date**: 2026-03-09  
> **Status**: Phase 1 Complete — Core fixes implemented

---

## Issues Fixed

### 1. Address Section Hidden for 'ask' ❌ → ✅ Fixed

**Before:** Address section (`LocationCard`) was completely hidden when `callType === 'ask'`

**After:** Address section always visible (for customer records), but validation is conditional based on call type requirements

**Rationale:** Even for 'ask' calls, we want to capture/update customer address information. The address is just not required for confirmation.

---

### 2. Items Editor Shown for All Types ❌ → ✅ Fixed

**Before:** Items editor shown even for 'ask' calls (confusing, not needed)

**After:** 
- **'ask' calls:** Show notes-only textarea (larger, focused on inquiry notes)
- **Other calls:** Show full `OrderItemsEditor` component

**Rationale:** 'ask' calls don't need items, but still need notes. Cleaner UX.

---

### 3. No Centralized Call Type Configuration ❌ → ✅ Fixed

**Before:** Call type logic scattered throughout component, hardcoded conditionals

**After:** `CALL_TYPE_CONFIG` object defines:
- Requirements per type (items, address, delivery date)
- UI behavior (show items editor, show address)
- Allowed actions (confirm, schedule, no_answer, cancel)
- Visual properties (label, icon, color)

**Benefits:**
- Single source of truth
- Easy to extend new call types
- Consistent validation
- Clear documentation of behavior

---

## Call Type Configuration

```javascript
const CALL_TYPE_CONFIG = {
  ask: {
    requiresItems: false,
    requiresAddress: false,
    requiresDeliveryDate: false,
    createsTicket: false,
    showItemsEditor: false,
    showAddress: true, // Always show for customer records
    allowedActions: ['confirm', 'cancel']
  },
  sell: {
    requiresItems: true,
    requiresAddress: true,
    requiresDeliveryDate: true,
    createsTicket: true,
    showItemsEditor: true,
    showAddress: true,
    allowedActions: ['confirm', 'schedule', 'no_answer', 'cancel']
  },
  // ... replacement, maintenance, return
};
```

---

## Validation Rules

| Call Type | Items Required | Address Required | Delivery Date Required |
|-----------|---------------|------------------|----------------------|
| **ask** | ❌ No | ❌ No (but shown) | ❌ No |
| **sell** | ✅ Yes | ✅ Yes | ✅ Yes |
| **replacement** | ✅ Yes | ✅ Yes | ✅ Yes |
| **maintenance** | ⚠️ Optional | ✅ Yes | ✅ Yes |
| **return** | ⚠️ Optional | ✅ Yes | ✅ Yes |

---

## Best Practices Implemented

1. **Configuration-Driven UI** — Call type config drives rendering and validation
2. **Always Show Address** — Customer records benefit from address capture, even if not required
3. **Conditional Items Editor** — Only show when needed, cleaner UX for 'ask'
4. **Consistent Validation** — All validation uses `CALL_TYPE_CONFIG` requirements
5. **Action Button Logic** — Buttons disabled/enabled based on `allowedActions` array

---

## Remaining Work (Future Phases)

### Phase 2: Backend Alignment
- [ ] Ensure backend validation matches frontend config
- [ ] Add call type validation helpers in backend
- [ ] Document API requirements per call type

### Phase 3: Enhanced Validation
- [ ] Real-time validation feedback (not just on submit)
- [ ] Visual indicators for required vs optional fields
- [ ] Better error messages per call type

### Phase 4: Testing
- [ ] Unit tests for call type config
- [ ] Integration tests for each call type flow
- [ ] E2E tests for validation

---

## Files Modified

- `front/src/components/call-center/CallSessionFAB.jsx`
  - Added `CALL_TYPE_CONFIG` object
  - Fixed address section conditional rendering
  - Conditional Items Editor rendering
  - Updated validation to use config
  - Updated action buttons to use `allowedActions`

---

## Testing Checklist

- [x] 'ask' call type shows address section
- [x] 'ask' call type shows notes-only editor (no items)
- [x] Other call types show full Items Editor
- [x] Validation works per call type requirements
- [x] Action buttons respect `allowedActions`
- [ ] Test all 5 call types end-to-end
- [ ] Test direct call vs order-based call flows

---

*Refactor complete. Ready for testing.*
