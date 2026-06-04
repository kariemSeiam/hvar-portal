# Legacy & Dead Code Audit — 2026-03-09

> venom-audit + venom-eat protocol

---

## Blast Radius Summary

| Target | Direct callers | Risk | Safe to delete? |
|--------|----------------|------|-----------------|
| useScanningSystem.js | 0 | ✅ | Yes |
| QRScanner.jsx | 0 | ✅ | Yes |
| OrderDataSender.jsx | 0 | ✅ | Yes |
| camera.js | 0 | ✅ | Yes |

---

## 1. useScanningSystem (front/src/hooks/useScanningSystem.js)

**Direct callers:** 0 (only README.md mentions it)
**Transitive callers:** None
**Orphan risk:** Yes — hook is defined but never imported
**Risk level:** ✅ Safe
**What breaks if deleted:** Nothing. HubPage has its own inline scanner.
**Safe to proceed?** Yes

---

## 2. QRScanner (front/src/components/order/QRScanner.jsx)

**Direct callers:** 0
**Transitive callers:** None (exported from order/index.js but no one imports order)
**Orphan risk:** Yes
**Risk level:** ✅ Safe
**What breaks if deleted:** Remove export from order/index.js
**Safe to proceed?** Yes

---

## 3. OrderDataSender (front/src/components/order/OrderDataSender.jsx)

**Direct callers:** 0
**Transitive callers:** Exported via common/index.js → components/index.js, but no component imports it
**Orphan risk:** Yes
**Risk level:** ✅ Safe
**What breaks if deleted:** Remove from common/index.js, order/index.js
**Safe to proceed?** Yes

---

## 4. camera.js (front/src/utils/camera.js)

**Direct callers:** 0
**Transitive callers:** None
**Orphan risk:** Yes — HVAR camera integration; permissions.js has its own requestCameraPermission
**Risk level:** ✅ Safe
**What breaks if deleted:** Nothing
**Safe to proceed?** Yes

---

## 5. React imports (22 files)

**Status:** ErrorBoundary requires `React.Component` — keep.
**Action:** Remove from 21 files that only use hooks. Skip ErrorBoundary.
**Risk:** 🟢 Low — verify each file uses useState/useEffect etc., not React.X

---

## Execution Order

1. Delete useScanningSystem.js
2. Delete QRScanner.jsx, update order/index.js
3. Delete OrderDataSender.jsx, update common/index.js, order/index.js
4. Delete camera.js
5. Remove React imports from 21 files (batch)
