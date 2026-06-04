# work/ — Index

> One folder per feature. VENOM standard.
> Lifecycle: active → ship → promote to docs/memory or delete.

---

## Structure

| Folder | Contents |
|--------|----------|
| `erp/sync/` | ERP sync worker, scheduled fix, legacy endpoints |
| `erp/data/` | ERP vs DB comparisons, gap analysis, diagnostics |
| `erp/orders/` | Order keys, drafts vs Bosta, order_description study |
| `call-center/` | Refactor, filters, sessions, call type audit |
| `legacy/` | Legacy cleanup plans, audits |
| `bosta/` | Bosta diagnostics, orders structure, financial audit |
| `service/` | Service actions search |
| `audits/` | Blast radius, hot wires, escalated removal, full-repo review, VENOM command contract |
| `_template/` | planning.md, discussion.md, thinking.md, notes.md |

---

## Active

See `ACTIVE.md` for current focus.

---

## New Feature

1. Create `work/[feature-name]/`
2. Copy templates from `_template/` as needed
3. Add entry above
