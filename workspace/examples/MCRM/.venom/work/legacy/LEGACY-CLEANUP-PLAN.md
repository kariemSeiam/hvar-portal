# Legacy Code Cleanup Plan

> **Date**: 2026-03-09  
> **Status**: In Progress  
> **Goal**: Remove all legacy code, standardize patterns, clean codebase

---

## Inventory

### 1. Legacy React Imports (50+ files)
**Issue**: React 18 auto JSX transform — `import React from 'react'` not needed  
**Impact**: Low (works but unnecessary)  
**Files**: 50+ JSX files still have legacy imports

### 2. Console Statements (50+ files)
**Issue**: console.log/debug/warn scattered throughout  
**Impact**: Low (terser strips in prod, but dev noise)  
**Action**: Keep only useful errors/warnings, remove debug logs

### 3. Dead Code
**Status**: ✅ `loadTickets` already removed  
**Status**: ✅ `leaderRespondToInfo` already removed  
**Check**: Any other unused exports/functions

### 4. TODO/FIXME Markers
**Status**: Some already resolved (user_id auth)  
**Action**: Review remaining, implement or document

### 5. Inconsistent Patterns
- Mixed error handling (alert vs toast)
- Different validation approaches
- Inconsistent state management patterns

---

## Execution Plan

### Phase 1: React Imports (Quick Win)
- [ ] Remove `import React from 'react'` from all JSX files
- [ ] Keep only hook/component imports
- [ ] Verify no breaking changes

### Phase 2: Console Cleanup
- [ ] Remove debug console.log statements
- [ ] Keep console.error for error boundaries
- [ ] Keep console.warn for deprecation warnings
- [ ] Document intentional console usage

### Phase 3: Dead Code Removal
- [ ] Scan for unused exports
- [ ] Remove deprecated functions
- [ ] Clean up commented-out code

### Phase 4: Pattern Standardization
- [ ] Standardize error handling (toast.error everywhere)
- [ ] Standardize validation patterns
- [ ] Document conventions

---

## Files to Clean

**React Imports (50+ files):**
- All files in `front/src/components/**/*.jsx`
- `front/src/main.jsx`
- `front/src/utils/hubIcons.jsx`

**Console Statements:**
- `front/src/api/callCenterAPI.js` (multiple)
- `front/src/components/service/ServiceActionsPage.jsx`
- `front/src/utils/dateUtils.js`
- `front/src/components/modals/ServiceWorkflowActionModal.jsx`

---

**✅ Phase 1 Complete**: React imports cleaned (50+ files)
**🔄 Phase 2 In Progress**: Console cleanup
