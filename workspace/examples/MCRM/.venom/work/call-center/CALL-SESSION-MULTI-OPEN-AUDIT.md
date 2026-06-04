# Call Session Multi-Open & View Action Audit

> **Problem**: Both "Call" and "View" buttons do the same thing. Clicking multiple orders opens multiple sessions or doesn't switch properly.

---

## Current State

### Issue 1: onCall = onView ❌

```javascript
// CustomerServicePage.jsx:596-597
onCall={handleCall}
onView={handleCall}  // ← Same handler!
```

Both buttons call `handleCall` → opens full call session modal.

**User wants**: 
- 📞 Call button → Full call session (editable, actions)
- 👁️ View button → Read-only modal (just display, no actions)

---

### Issue 2: No Session Switching Protection

```javascript
// CallSessionContext.jsx:21-23
const startCallSession = useCallback((order, customerContext = null) => {
    setActiveCallSession({ order, customerContext });
}, []);
```

No check if session already active. Clicking a new order while one is open:
- Immediately replaces session
- No warning
- Loses unsaved edits
- No transition

---

### Issue 3: CallSessionFAB Doesn't React to Clicks When Open

When FAB is open (modal showing), clicking the FAB mini-indicator at bottom:
- Should either:
  1. Close current session
  2. Switch to clicked order (with confirmation if edits exist)
  3. Show "session already open" message

Currently: Nothing happens (click event probably consumed by modal backdrop).

---

## Root Causes

**1. View Action Never Implemented**
- OrdersTable has `onView` prop
- CustomerServicePage passes `handleCall` for both
- No separate read-only modal exists

**2. Session Context Naive**
- No active session check before starting new one
- No "has edits" tracking at context level
- No session queue or switch logic

**3. FAB Click Behavior**
- When modal is open, clicking the FAB mini-card at bottom does nothing
- No explicit handler for "switch session while open"

---

## Recommended Solutions

### Phase A: Separate View from Call ✓

**A1: Create Read-Only View Modal**

New component: `OrderViewModal.jsx` (simplified CallSessionFAB without edit/action buttons)

```javascript
// CustomerServicePage.jsx
const [viewingOrder, setViewingOrder] = useState(null);

const handleView = useCallback((order) => {
  setViewingOrder(order); // Just view, no session
}, []);

const handleCall = useCallback((order) => {
  startCallSession(order, minimalContext); // Full session
}, []);

// Pass separate handlers
<OrdersTable 
  onCall={handleCall}  // 📞 → Full session
  onView={handleView}  // 👁️ → Read-only modal
/>
```

**A2: Alternative (Simpler): View = Call but Read-Only Flag**

```javascript
const handleView = useCallback((order) => {
  startCallSession(order, { ...minimalContext, readOnly: true });
}, []);

// CallSessionFAB checks readOnly prop, hides edit/action buttons
```

---

### Phase B: Session Switching Protection ✓

**B1: Add hasEdits to Context**

```javascript
// CallSessionContext.jsx
const [activeCallSession, setActiveCallSession] = useState(null);
const [hasUnsavedEdits, setHasUnsavedEdits] = useState(false);

const startCallSession = useCallback((order, customerContext = null) => {
  // Check if session already open
  if (activeCallSession && hasUnsavedEdits) {
    const confirmed = window.confirm(
      'لديك تعديلات غير محفوظة في المكالمة الحالية.\nهل تريد إغلاق المكالمة الحالية وفتح مكالمة جديدة؟'
    );
    if (!confirmed) return; // User cancels
  }
  
  setActiveCallSession({ order, customerContext });
  setHasUnsavedEdits(false);
}, [activeCallSession, hasUnsavedEdits]);
```

**B2: Track Edits in FAB**

```javascript
// CallSessionFAB.jsx
useEffect(() => {
  if (hasEdits !== prevHasEdits) {
    setHasUnsavedEdits(hasEdits); // Notify context
  }
}, [hasEdits]);
```

---

### Phase C: FAB Click When Open ✓

**C1: Detect Click on FAB Mini-Indicator**

```javascript
// CallSessionFAB.jsx
const handleFABClick = (e) => {
  e.stopPropagation();
  if (isExpanded) {
    // Already open → toggle minimize/maximize
    setIsExpanded(!isMinimized);
  } else {
    // Currently minimized → expand
    setIsExpanded(true);
  }
};

// In render:
<div onClick={handleFABClick} className="...mini-indicator...">
  {customerName} {phone}
</div>
```

**C2: Show Session Indicator When Open**

Add visual feedback: when session is open, the FAB indicator should:
- Pulse/glow to show active session
- Show order ID
- Be clickable to expand/minimize

---

## Implementation Priority

| Phase | Change | Files | Risk | Impact |
|-------|--------|-------|------|--------|
| **A** | Separate View from Call | CustomerServicePage, OrdersTable, +ViewModal | 🟢 Low | High |
| **B** | Session switch protection | CallSessionContext, CallSessionFAB | 🟡 Medium | High |
| **C** | FAB click when open | CallSessionFAB | 🟢 Low | Medium |

---

## Simplest Path Forward

**Option 1: Read-Only Flag (Fastest)**
1. Add `readOnly` prop to CallSessionFAB
2. When true: hide edit/action buttons, show "عرض فقط" badge
3. CustomerServicePage: `handleView` passes `readOnly: true`

**Option 2: Separate Modal (Cleaner)**
1. Create `OrderViewModal` (lightweight, no actions)
2. Use for 👁️ View button
3. Keep CallSessionFAB for 📞 Call button

**Recommendation**: Option 1 (faster, reuses existing component, less code).

---

*Generated: 2026-03-10*  
*Next: Wait for go.*
