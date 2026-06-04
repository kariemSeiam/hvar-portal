# Perfect Full MDs — VENOM Style (Excluding .cursor)

**Scope:** All project markdown outside `.cursor/`. No code changes. No edits under `.cursor/`.

**Goal:** Every major folder has a README for GitHub; all docs are clean, dense, answer-first (VENOM vibes). Single voice. World-class dev-doc standard.

---

## Out of scope

- **`.cursor/`** — Do not touch. (VENOM/agent config, commands, rules, memory, skills.)

---

## 1. Root

| File | Action |
|------|--------|
| **README.md** | Rewrite: project one-liner, stack, quick start (3 commands), link to `docs/INDEX.md`, features as tight table. No badges bloat; keep badges only if you trim to one line. |
| **SETUP_LOCAL.md** | Polish: prerequisite list, numbered steps, code blocks only where needed. Add "See also: docs/INDEX.md" at end. |
| **RUN_WSGI.md** | Polish: purpose in one line, then steps (find process, kill, verify). Remove redundancy. |
| **VALIDATION.md** | Keep structure (9 tests); tighten expected/fail text; no filler. |
| **CURSOR.md** | Light polish: keep commands table and rules stack; trim intro to one block. |

---

## 2. docs/

| Item | Action |
|------|--------|
| **docs/README.md** (new) | Add short README: "Canonical project docs. Start at [INDEX.md](INDEX.md)." + one-line list: call-center, hub, system, design, reviews, plans, archive. |
| **docs/INDEX.md** | Already VENOM-style. Only change: expand "Other Docs (Outside docs/)" with Root + dev + front paths (no .cursor). Remove or leave .cursor line as "Not documented here (agent config)." |
| **docs/hub/README.md** (new) | Add: purpose (post-call hub workflows), list of 4 files (service_tickets, replacement, maintenance, return) with one-line each. Link to docs/INDEX. |
| **docs/system/README.md** (new) | Add: purpose (API, customer, stock, tickets filters, frontend structure), list files with one-line each. Link to docs/INDEX. |
| **docs/call-center/README.md** | Polish to VENOM: one paragraph, link to INDEX, "Read first" in 4 bullets. |

No changes to doc content inside docs/call-center, docs/hub, docs/system, design, reviews, plans, archive — only READMEs and INDEX "Other Docs" section.

---

## 3. dev/

| File | Action |
|------|--------|
| **dev/README.md** | Rewrite: purpose (collab memory + idea folders), structure in one table, _template + call-center-page one line each. Link to docs/ for canonical call-center. |
| **dev/CONTEXT.md** | Tighten: "What I watch for" as compact list; "When I suggest" as 3 bullets; remove repetitive pattern blocks. |
| **dev/MANAGEMENT.md** | Tighten: discussion mode (4 steps), update process (one flowchart or list). Cut duplicate "I will" phrasing. |
| **dev/TONE.md** | Leave short; if long, trim to principles + one example. |
| **dev/START_PROMPT.md** | One block: what to paste to start a chat. No filler. |
| **dev/_template/README.md** | One paragraph + list of files (start, thinking, planning, uiux, discussion, notes). Same for _template/*.md: ensure each has a one-line purpose at top. |
| **dev/call-center-page/README.md** | Rewrite: "Source of docs/call-center (pre-migration). Canonical: docs/call-center/." + one-line list of files. |

**dev one-offs** (LEGACY_SCAN, LEGACY_REMEDIATION_PLAN, ROUTE_STRUCTURE_FIX, PHASE_1_COMPLETE, FRONTEND_LAZY_LOADING_SUMMARY, HubSidebar-Redesign-Plan, bundle-analysis-report): optional single pass — add one-line purpose at top of each; no structural move (stay in dev/).

---

## 4. front/

| Item | Action |
|------|--------|
| **front/README.md** (new) | Add: stack (React 18, Vite 6, Tailwind, RTL), scripts (dev/build/preview), entry points (App.jsx, design-tokens.css). Link to front/src/pages/README and front/src/styles/README. |
| **front/src/README.md** (new) | Add: layout (pages, components, api, contexts, utils, styles), "Start at App.jsx and docs/system/frontend-structure.md". |
| **front/src/pages/README.md** | Polish: route table only, bundle-splitting note, "Removed" section one line. Link to App.jsx. |
| **front/src/styles/README.md** | Polish: design-tokens.css = source of truth; Tailwind must match; migration bullets only. |
| **front/src/components/README.md** (new) | Add: high-level groups (call-center, hub, modals, service, stock, ui, layout, filters, forms), link to design system (docs/design, hub-design.mdc). |
| **front/src/components/service/BostaSearchResultScreen/BostaSearchResultScreen.md** | Polish: overview one line, layout diagram keep, user flows table keep; trim prose to essentials. |

---

## 5. app/

| Item | Action |
|------|--------|
| **app/README.md** (new) | Add: stack (Flask, MySQL), layout (api/, services/, models/, utils/, config.py). Table: api → route role, services → business logic, models → DB, utils → shared. Link to docs/INDEX and docs/system (api_endpoints, stock, customer). |

---

## 6. docs/INDEX.md "Other Docs" section (no .cursor)

Replace "Other Docs" with a clear map (no .cursor):

- **Root:** README.md (overview), SETUP_LOCAL.md (local setup), RUN_WSGI.md (port 5050), VALIDATION.md (VENOM tests), CURSOR.md (VENOM in Cursor).
- **dev:** README (collab/ideas), CONTEXT.md, MANAGEMENT.md, TONE.md, START_PROMPT.md; _template/ (idea template); call-center-page/ (source of docs/call-center); one-offs (legacy, phase, lazy-load, sidebar, bundle).
- **front:** front/README (frontend), front/src/README (src layout), front/src/pages/README (routes), front/src/styles/README (tokens), front/src/components/README (component groups), BostaSearchResultScreen.md (component spec).
- **app:** app/README (backend layout).
- **.cursor:** Not documented here (agent/IDE config).

Optional: add **docs/OTHER-DOCS.md** with full path list + one-line purpose + "read when"; link from INDEX.

---

## 7. VENOM style rules (apply to all touched MDs)

- First line or short block: what this is / when to read it.
- No "Welcome", "In this document", "Let's get started".
- Use tables for lists of items with 2+ attributes.
- Code blocks: only where necessary; language tag.
- Sections: ## for top-level; ### only if needed.
- Links: relative paths; link to INDEX where relevant.
- Length: as short as possible without losing signal.

---

## Execution order

1. Root: README, SETUP_LOCAL, RUN_WSGI, VALIDATION, CURSOR.
2. app/README (new).
3. front/README (new), front/src/README (new), front/src/pages/README, front/src/styles/README, front/src/components/README (new), BostaSearchResultScreen.md.
4. docs/README (new), docs/hub/README (new), docs/system/README (new), docs/call-center/README; docs/INDEX "Other Docs" (and optional OTHER-DOCS.md).
5. dev/README, CONTEXT, MANAGEMENT, TONE, START_PROMPT; dev/_template/README (+ template files light pass); dev/call-center-page/README.
6. Optional: dev one-offs one-line top; optional OTHER-DOCS.md.

---

## Deliverables

- Every major folder (root, app, front, front/src, front/src/components, front/src/pages, front/src/styles, docs, docs/call-center, docs/hub, docs/system) has a README that is GitHub-ready and VENOM-style.
- All touched .md files: clean, dense, answer-first, no .cursor edits.
- Single entry point for "rest of docs": docs/INDEX.md (and optionally docs/OTHER-DOCS.md) with no .cursor dependency.
