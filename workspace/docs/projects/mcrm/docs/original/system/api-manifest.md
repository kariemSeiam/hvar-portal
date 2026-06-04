# API manifest — VENOM brain for HUB-MCRM API

> One read = when to use it, how to use it, where to look. This is part of VENOM's body.

---

## What this is

**Single source of truth** for every HUB-MCRM endpoint: method, path, path/query/body params, response and error cases. File: `api-manifest.json` in this directory. **MCP `hub-mcrm-api`** exposes it as resource + one callable tool so VENOM can discover and call any endpoint without guessing.

---

## When VENOM uses it

Use the manifest / MCP when:

- **Debugging API** — "Why does this endpoint return 400?" → Check manifest for body/query/path_params and error codes; call via MCP to reproduce.
- **Testing a flow** — Sync-from-ERP → confirm → leader-approve → ticket. Call `call_center_sync_from_erp`, then `call_center_confirm_by_customer`, then `call_center_leader_approve` with the right ids.
- **Inspecting state** — Queue, orders, tickets, stock. Use `call_center_list_orders`, `call_center_order_counts`, `tickets_filter`, `stock_items_list`, etc.
- **Verifying without curl** — Same as above; MCP tool returns status + JSON so you see exactly what the API returns.
- **Exploring** — Don't remember an endpoint's args? Fetch resource `hub-mcrm://manifest` and search by scope or operation_id.

Don't use it when: editing frontend components (use existing API clients in `front/src/api/`), or when the task is purely static (docs, copy). Use it when the task **touches** backend behavior, API contract, or live data.

---

## How to use it

1. **Discover** — Fetch MCP resource `hub-mcrm://manifest`. You get the full JSON: every `operation_id`, path, path_params, query_params, body, responses, errors.
2. **Call** — Use MCP tool `hub_mcrm_api_call` with:
   - `operation_id` (required) — e.g. `call_center_list_orders`, `tickets_get`, `hub_scan`.
   - `path_params` (optional) — e.g. `{ "order_id": 42 }`, `{ "ticket_id": 1 }`, `{ "tracking_number": "BT-xxx" }`.
   - `query` (optional) — e.g. `{ "status": "new", "page": 1 }`.
   - `body` (optional) — for POST/PUT, e.g. `{ "customer_phone": "01...", "confirmation_snapshot": { ... } }`.

Result: `{ status, statusText, data }` so you see success/error and payload.

---

## Scope → operation_id (quick map)

| Scope | Prefix | Examples |
|-------|--------|----------|
| Call center | `call_center_*` | `call_center_list_orders`, `call_center_leader_approve`, `call_center_sync_from_erp`, `call_center_confirm_by_customer` |
| Tickets | `tickets_*` | `tickets_create`, `tickets_get`, `tickets_confirm`, `tickets_filter`, `tickets_execute_action` |
| Hub | `hub_*` | `hub_scan`, `hub_scan_receive`, `hub_workshop_complete`, `hub_queues_workshop` |
| Stock | `stock_*` | `stock_items_list`, `stock_items_adjust`, `stock_movements`, `stock_export` |
| Bosta | `bosta_*` | `bosta_search`, `bosta_get_order`, `bosta_customer_orders` |
| Customers | `customers_*` | `customers_list`, `customers_search`, `customers_get`, `customers_update` |
| ERP | `erp_*` | `erp_get_drafts` |

If you're working on "call center" → think `call_center_*`. On "tickets" → `tickets_*`. The manifest has the exact params for each.

---

## Schema (per operation in manifest)

| Field | Meaning |
|-------|--------|
| `id` | operation_id (use this in `hub_mcrm_api_call`). |
| `method` | GET, POST, PUT, DELETE. |
| `path` | Path with `{param}` placeholders. |
| `path_params` | `[{ name, type }]` for placeholders. |
| `query_params` | `[{ name, type, optional?, enum? }]`. |
| `body` | Body schema for POST/PUT. |
| `responses` | `{ "200": "...", "400": "..." }`. |
| `errors` | Error codes the endpoint can return. |

---

## Keeping it updated

When you add or change an endpoint in Flask:

1. Add or edit the corresponding entry in `api-manifest.json`.
2. No change in the MCP server — it reads the manifest at runtime.

---

## Where this lives in VENOM's body

- **Rules:** `.cursor/rules/mcp-tools.mdc` — task → hub-mcrm-api when task touches API / call-center / tickets / hub / stock / bosta / customers / erp.
- **Context:** `.venom/CONTEXT.md` — Navigation points here; Key tools mention API manifest + MCP.
- **Anatomy:** `.venom/ANATOMY.md` — §3 references this file and scope → operation_id.

So when you need to know or call the API: this doc + manifest + MCP are the one place. No second guess.
