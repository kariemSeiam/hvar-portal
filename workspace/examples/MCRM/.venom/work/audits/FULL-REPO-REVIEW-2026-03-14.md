# Full Repo Review — Deep Snapshot

Date: 2026-03-14
Scope: Full repository risk-first audit (backend, frontend, schema/migrations, docs/config drift).
Method: Hotspot inventory -> backend audit -> frontend flow audit -> schema parity audit -> severity synthesis.

---

## Critical Findings

1) Auth model is insecure and leaks sensitive data.
- Files: `app/api/auth_api.py`
- Evidence:
  - Password comparison in plaintext.
  - Admin authorization based on `X-User-Phone` static phone check.
  - User listing and creation responses include password values.
- Impact:
  - Privilege escalation and credential disclosure.
  - Weak trust boundary across admin functions.
- Fix direction:
  - Replace header check with signed auth (JWT/session) + RBAC.
  - Hash passwords (`argon2` or `bcrypt`) and remove password from all responses.

2) Frontend workflow modal calls missing API methods.
- Files:
  - `front/src/components/modals/UnifiedServiceActionModal/index.jsx`
  - `front/src/api/serviceActionAPI.js`
- Evidence:
  - Calls to `updateToPendingSend`, `scanSend`, `updateServiceActionStatus`.
  - Exported API object does not provide these functions.
- Impact:
  - Runtime failures on workflow actions in production paths.
- Fix direction:
  - Route actions through `executeTicketAction` in `front/src/api/ticketsAPI.js`.
  - Remove stale workflow API calls from modal.

3) ERP credential handling and transport security are unsafe.
- File: `app/api/erp_api.py`
- Evidence:
  - Credentials accepted via query parameters.
  - ERP requests use `verify=False`.
- Impact:
  - Credential leakage via logs/history and weak TLS guarantees.
- Fix direction:
  - Move credentials to secure server-side config or POST body.
  - Enable certificate verification where possible.

---

## High Findings

1) Order-to-ticket conversion race condition.
- File: `app/api/call_center_api.py` (`leader-approve`)
- Evidence:
  - Check-then-create-then-update flow without locking/atomic guard.
- Impact:
  - Potential duplicate tickets from concurrent approvals.
- Fix direction:
  - One transaction with row lock (`SELECT ... FOR UPDATE`) and guarded update.
  - Enforce one-to-one by unique constraint on `service_tickets.created_from_order_id`.

2) Replacement confirmation argument misalignment risk.
- Files:
  - `app/api/service_api.py`
  - `app/services/service_manager.py`
- Evidence:
  - `/tickets/<id>/confirm` replacement call is positional and omits an intermediate arg.
- Impact:
  - Mis-mapped values in tracking/cost/notes under specific payloads.
- Fix direction:
  - Convert all confirm calls to keyword arguments.
  - Add regression test for argument mapping.

3) Lock semantics are effectively client-side/mocked.
- Files:
  - `front/src/api/callCenterAPI.js`
  - `front/src/components/call-center/CallSessionFAB.jsx`
  - `app/api/call_center_api.py` (no lock enforcement in mutating routes)
- Evidence:
  - Frontend comments and logic indicate view-only/non-blocking lock behavior.
  - Backend lacks lock ownership checks in mutate actions.
- Impact:
  - Multi-agent conflicts on same order.
- Fix direction:
  - Real lock/unlock backend endpoints.
  - Enforce lock/version checks for state-changing routes.

4) ERP dedup is not fully atomic.
- Files:
  - `app/workers/erp_sync_worker.py`
  - `app/models/order.py`
- Evidence:
  - Read-then-insert dedup pattern by `erp_order_id`.
- Impact:
  - Duplicate order risk under concurrent writers without strict DB uniqueness.
- Fix direction:
  - Add DB unique index for `erp_order_id`.
  - Use atomic upsert (`INSERT ... ON DUPLICATE KEY UPDATE`).

---

## Medium Findings

1) Sell validation mismatch on frontend.
- Files:
  - `front/src/components/modals/UnifiedServiceActionModal/formValidation.js`
  - `front/src/components/modals/UnifiedServiceActionModal/ticketPayload.js`
- Evidence:
  - Validation requires `selectedParts`, while payload builder supports combined sell items.
- Impact:
  - False validation failures for valid sell payloads.
- Fix direction:
  - Validate by final payload item count.

2) Catch block scope bug in service creation path.
- File: `front/src/components/service/ServiceActionsPage.jsx`
- Evidence:
  - `payload` logged in catch although defined inside try scope.
- Impact:
  - Secondary `ReferenceError` can hide root API error.
- Fix direction:
  - Declare payload outside try or remove that catch log.

3) Schema parity verification gap.
- Files:
  - `migrations/run_migrations.py`
  - `migrations/001_initial_schema.sql` (read-limited in this environment)
- Evidence:
  - Direct DDL read is blocked in this environment; runtime assumptions and migration runner behavior were used for inference.
- Impact:
  - Unverified constraints risk.
- Fix direction:
  - Add schema-assertion tests and CI migration checks.

---

## Docs / Config Drift Candidates

1) Env var docs differ from runtime frontend config.
- Docs:
  - `README.md`
  - `SETUP_LOCAL.md`
- Runtime:
  - `front/src/config/environment.js`
- Drift:
  - Docs emphasize `VITE_APP_API_URL`.
  - Dev runtime prefers `VITE_APP_API_URL_DEV`.

2) API docs likely stale in selected call-center/system docs vs current flow contracts.
- Candidate docs:
  - `docs/system/api_endpoints.md`
  - `docs/call-center/API_ENDPOINTS.md`

---

## What Works Well

- Strong domain separation in backend (`api`, `services`, `models`) and frontend (`api`, `components`, `contexts`).
- Good foundation for targeted hardening without architecture rewrite.
- Existing state-machine and workflow structure can absorb improvements incrementally.

---

## Priority Fix Order (Safe Sequence)

1) Secure auth surface (`auth_api.py`) and remove password leakage.
2) Fix frontend workflow action dispatch to valid ticket APIs.
3) Make leader-approve conversion atomic and idempotent.
4) Implement backend lock enforcement for order mutations.
5) Harden ERP dedup with DB uniqueness + upsert.
6) Backfill tests for critical transitions and failure paths.

---

## Required Test Additions

- `app/api/auth_api.py`: authN/authZ and response sanitization.
- `app/api/call_center_api.py`: concurrent leader-approve idempotency.
- `app/api/service_api.py`: replacement confirm argument mapping.
- `app/workers/erp_sync_worker.py`: dedup and delete guard behavior.
- `front/src/components/modals/UnifiedServiceActionModal/*`: workflow action mapping.
- `front/src/components/service/ServiceActionsPage.jsx`: create-failure catch path.

