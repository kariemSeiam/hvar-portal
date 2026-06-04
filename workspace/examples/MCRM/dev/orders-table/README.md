# Orders Table — Call Center Backbone

> **Purpose:** One canonical `orders` table that holds all call-center orders (ERP + direct), with optional Bosta tracking and a clear link to the single ticket created from it (when converted). Ready for implementation.

**Eat first:** [PLAN.md](PLAN.md) — vision, schema, relations, migration outline, API alignment.

**Implementation path:** [IMPLEMENTATION-RECOMMENDATION.md](IMPLEMENTATION-RECOMMENDATION.md) — phased approach, gates, risks, checklist (all minds).

**Canonical docs:** `docs/call-center/` (INDEX, calls-model, order-lifecycle, API_ENDPOINTS, DATA-AND-RELATIONS).

**Status:** Plan complete; implementation not started (no `orders` or `calls` tables in DB yet; `service_tickets` has no `created_from_order_id`).
