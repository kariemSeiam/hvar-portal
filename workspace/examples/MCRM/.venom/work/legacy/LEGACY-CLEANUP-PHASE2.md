# Legacy Cleanup - Phase 2 (Continued)

> **Date**: 2026-03-09  
> **Status**: In Progress

---

## Additional Cleanup

### ✅ Fixed Syntax Error
- **File**: `front/src/utils/dateUtils.js`
- **Issue**: Missing opening brace in `formatGregorianDate` arrow function
- **Fix**: Changed from `=>` to `=> {` with proper function body

### ✅ Removed More React Imports
- `CallSessionFAB.jsx` - removed React import (only uses hooks)
- `CallHistoryModal.jsx` - removed React import (only uses hooks)

---

## Remaining React Imports

**Files that still have `import React`** (100+ files):
- Many are likely pure JSX/hooks only and can be cleaned
- Some may use React.Component, React.memo, etc. (need to keep)

**Next Steps**:
- Batch check remaining files for React API usage
- Remove React imports where only hooks are used
- Keep React imports where React.Component, React.memo, etc. are used

---

*Continuing cleanup...*
