# mCRM Direction — هفار

> Direction for the staff portal — mCRM. Flask/Python, internal tool. Different design principles than the customer portal because different users, different goals, different conditions of use.

---

## mCRM's Role

mCRM is the staff window into the same system that customers see through hvarstore.com. Both windows look at the same data — `hvar_erp` for products, orders, and contacts; `mcrm_hvar_hub` for service tickets. The difference is perspective and purpose.

mCRM's jobs:
- **Order confirmation:** agents review draft orders (created by hvarstore.com → ERP webhook) and confirm them, which triggers stock deduction and Bosta shipment creation
- **Service ticket management:** agents create, update, and progress service tickets (HVM maintenance, HVR replacement, HVT return) through their state machines
- **Customer contact management:** agents look up contacts by phone, see order history and ticket history
- **Operational oversight:** coordinators and managers see the full picture — order volume, ticket queue, agent performance (reports section)

What mCRM is NOT:
- Not a product management interface (the ERP handles that)
- Not a financial system (the ERP and Kashier handle that)
- Not the customer portal (customers use hvarstore.com)

---

## User Persona

**Primary: Customer-Facing Agent**

The agent who uses mCRM most heavily is on the phone or WhatsApp with customers while simultaneously working in the system. They are:
- Egyptian, Arabic-primary
- Working at a desk or laptop (desktop-primary workflow)
- Experienced with basic web applications but not technical
- Measured by: orders confirmed per day, tickets resolved, customer wait time
- Frustrated by: slow load times, ambiguous ticket states, unclear next steps in a workflow

The agent does not care if mCRM is beautiful. They care if it is fast and clear. An ugly interface that is unambiguous and loads in 300ms is better than a beautiful interface that requires two extra clicks to confirm an order.

**Secondary: Service Coordinator**

Manages the service ticket queue. More technical understanding of the ticket state machine. Needs to see the full pipeline — how many tickets in each state, which ones are stuck, which ones need escalation.

**Tertiary: Operations Manager**

Primarily a viewer — sees reports, order volume, financial summaries. Does not operate the day-to-day flows. Needs aggregated views, not individual record management.

---

## Design Principles for Internal Tools

### Density Over Beauty

The customer portal gives breathing room to every product card and section because the audience is browsing — they need the space to feel engaged and unhurried. In mCRM, the agent has a task to complete. Every additional scroll, every unnecessary whitespace, every modal that requires two clicks to dismiss — these cost time across hundreds of daily operations.

**In practice:**
- Table rows in mCRM can be denser than product cards in hvarstore.com
- Font size can be 14px where 16px is the minimum for the customer portal
- Spacing between list items can be `--space-3` rather than `--space-6`
- Multiple pieces of information can live on one row (order ID + customer name + phone + status + action button)

### Clarity Over Delight

mCRM should not have scroll reveals, card shine effects, or ambient atmosphere. Those serve emotional engagement in the customer portal. In mCRM, they would be distractions. Every visual element in mCRM must serve a functional purpose.

**What stays from the brand system:**
- Hvar red for primary actions (confirm, submit)
- Brand color for state indicators (ticket states, order states)
- Cairo typeface for Arabic UI text
- Correct color tokens (`--c-*` from the design system) — not hardcoded colors
- Basic brand identity: this should be recognizably Hvar, not a generic admin panel that could belong to anyone

**What does not belong in mCRM:**
- Grain texture overlay
- Ambient glow
- Wilson pattern animations (scroll reveals, card shine)
- Editorial photography
- Marketing copy

### Workflow Over Discovery

The customer portal is designed for discovery — the user does not know exactly what they want, and the design should help them explore. mCRM is designed for workflow — the agent knows exactly what task they are doing, and the design should get out of the way.

**In practice:**
- Keyboard shortcuts for common actions (confirm order, open ticket, search by phone)
- Default sort and filter states that match the most common workflow (newest orders first, open tickets by urgency)
- Bulk actions where applicable (confirm multiple orders)
- No landing page with inspirational content — land on the primary work queue

---

## Ticket State Machine

### Maintenance Tickets (HVM — صيانة)

```
PENDING → HUB_RECEIVED → IN_WORKSHOP → READY → CLOSED
                                     ↘ FAILED
PENDING → CANCELLED
```

| State | What it means | Agent action available |
|-------|--------------|----------------------|
| `PENDING` | Customer submitted ticket, not yet received | Cancel, or advance to HUB_RECEIVED when physical item arrives |
| `HUB_RECEIVED` | Physical item received at Hvar hub | Advance to IN_WORKSHOP when sent to workshop |
| `IN_WORKSHOP` | Item being repaired | Advance to READY when repair complete, or FAILED if not repairable |
| `READY` | Repair done, ready for customer pickup/delivery | Advance to CLOSED after customer collects |
| `CLOSED` | Complete | Terminal — no action |
| `FAILED` | Could not repair | Terminal — triggers refund or replacement discussion |
| `CANCELLED` | Cancelled before any action | Terminal — only from PENDING |

### Replacement Tickets (HVR — استبدال)

```
PENDING → HUB_RECEIVED → DISPATCHED → READY → CLOSED
                                     ↘ FAILED
PENDING → CANCELLED
```

| State | What it means | Agent action available |
|-------|--------------|----------------------|
| `PENDING` | Replacement requested | Cancel, or advance when old item received |
| `HUB_RECEIVED` | Old item received | Advance to DISPATCHED when replacement shipped |
| `DISPATCHED` | Replacement in transit to customer | Advance to READY when delivered |
| `READY` | Delivered to customer | Advance to CLOSED after customer confirmation |
| `CLOSED` | Complete | Terminal |
| `FAILED` | Replacement failed | Terminal |

### Return Tickets (HVT — مرتجع)

```
PENDING → HUB_RECEIVED → INSPECTED → REFUNDED → CLOSED
                                    ↘ FAILED (item damaged beyond policy)
PENDING → CANCELLED
```

| State | What it means | Agent action available |
|-------|--------------|----------------------|
| `PENDING` | Return requested | Cancel, or advance when item received |
| `HUB_RECEIVED` | Item received at hub | Advance to INSPECTED after inspection |
| `INSPECTED` | Inspection complete | Advance to REFUNDED if eligible, FAILED if not eligible |
| `REFUNDED` | Refund processed | Advance to CLOSED |
| `CLOSED` | Complete | Terminal |
| `FAILED` | Return rejected (outside policy, damaged) | Terminal |

### Visual Treatment of States

Each state gets a consistent visual treatment: a colored dot or badge next to the state label in lists, and a filled progress stepper in the detail view.

| State | Color | Rationale |
|-------|-------|-----------|
| PENDING | Slate/gray | Neutral — waiting, no action taken |
| HUB_RECEIVED | Blue | Active — in the system |
| IN_WORKSHOP | Amber | In progress — being worked on |
| DISPATCHED | Purple | In motion |
| INSPECTED | Blue | Active — judgment made |
| READY | Green | Positive resolution — waiting for final step |
| REFUNDED | Green | Positive resolution |
| CLOSED | Emerald | Complete |
| CANCELLED | Red | Terminated — problem or cancellation |
| FAILED | Red | Terminated — negative outcome |

State labels shown to agents in mCRM can be the English constants (HUB_RECEIVED) for clarity with tech support, or the Arabic labels — but be consistent. The Arabic labels shown to customers through hvarstore.com should always be used when representing ticket state to the customer.

---

## Order Confirmation Flow

This is the core agent workflow. Every order placed on hvarstore.com enters the ERP as `status='draft'`. It does not have stock deducted. It does not have a Bosta shipment. The agent's job is to verify and confirm it.

### What the Agent Sees

The order confirmation view should show, for each draft order:

| Field | Source | Notes |
|-------|--------|-------|
| Order ID | hvar_site.orders | HVAR-XXXX format |
| ERP Transaction ID | hvar_erp.transactions | Linked via website_order_id |
| Customer name + phone | hvar_erp.contacts | Click-to-call or WhatsApp direct |
| Items | hvar_erp.transaction_sell_lines | Product name + qty + price |
| Current stock | variation_location_details.qty_available | Re-checked at confirmation time |
| Shipping address | Full Arabic address | Governorate + district + detail |
| Payment method | hvar_site.orders | COD or Kashier |
| Order time | Created at timestamp | Elapsed time badge — how long this has been waiting |

### The Decision Points

1. **Stock check:** Is the stock sufficient? If `qty_available < qty_ordered` for any line item, the order cannot be confirmed. Agent must contact customer to offer alternatives, backorder, or cancellation.

2. **Address verification:** Is the shipping address valid and deliverable? mCRM should display the address clearly enough for the agent to make this call. If the district name is ambiguous (customer selected wrong district), the agent calls to verify.

3. **Customer contact verification:** Is the phone number reachable? For COD orders, the agent may call to confirm delivery. The customer's phone should be one click away from a call or WhatsApp.

4. **Confirm or cancel:** If all is in order, the agent confirms. This triggers:
   - ERP transaction moves from `draft` to `final`
   - Stock is deducted in `variation_location_details`
   - Bosta shipment is created (automatic or agent-triggered, depending on integration)
   - Customer notification sent (WhatsApp message template)

### UI Requirements at Each Decision Point

- Stock warning: if `qty_available < qty_ordered`, show a warning before the confirm button — not after. Don't let the agent confirm into an impossible stock situation.
- Confirm button: requires a deliberate click — not a dropdown that defaults to "confirm" and can be accidentally submitted. The action is irreversible.
- Cancellation: requires a reason selection and an optional note. This data feeds into the reporting layer.

---

## Speed Standards

mCRM is an internal tool. "It works" is not sufficient. "It works fast enough that agents do not lose time waiting" is the standard.

| Metric | Target |
|--------|--------|
| Page load (order list) | < 500ms from navigation |
| Search by phone (contacts) | < 300ms after keypress stop |
| Ticket detail page | < 400ms |
| Order confirmation action | < 1 second round trip |
| Table pagination | < 300ms per page |

These are achievable with proper query indexing and minimal N+1 patterns. A phone search that fires a LIKE query on an unindexed `mobile` column will never hit 300ms on a live dataset. Index the columns that are searched.

**Pagination standard:** 25 records per page for order lists and ticket queues. Not 100 (slow), not 10 (requires too many page flips). 25 is the balance between density and load time for most queue sizes.

---

## Error Handling Standards

### For Agents

mCRM can show more technical error information than hvarstore.com — agents have access to technical support and can use error context to file a support request. But this does not mean showing raw stack traces or database errors.

**Error format:**
```
[What happened, in plain language]
[What the agent should do next]
[Error code or reference if logging is needed]
```

Example: "تعذّر تأكيد الطلب — مشكلة في الاتصال بالـ ERP. جرب مرة ثانية. لو المشكلة استمرت، تواصل مع الدعم الفني وأشر إلى: ERR-ERP-TIMEOUT." The agent can repeat the action or escalate. They are not left without a path forward.

### For Managers

Reports and aggregated data errors can be slightly more verbose: "تعذّر تحميل التقرير — حد أقصى من الاستعلامات على قاعدة البيانات. جرب مرة ثانية بعد دقيقة." This is informative without being a raw exception.

### For Developers (Internal, Not Shown in UI)

All errors should be logged with full context: timestamp, user ID, action, ERP response (if applicable), full error stack. Logs are for developers; UI messages are for agents and managers.

---

## Access Control Direction

mCRM has three role levels. The principle is least privilege: each role sees and can do only what their job requires.

| Role | Can see | Can do |
|------|---------|--------|
| **Agent** | Order queue, ticket queue, contact lookup | Confirm orders, update tickets through state machine, add ticket notes |
| **Coordinator** | Full ticket management, agent activity view | Everything agents can do + reassign tickets + override ticket state (with reason) |
| **Manager** | Everything, including reports, financial summaries, agent performance | View-only on financial data; full control over agent and coordinator accounts |

**Implementation principle:** roles are enforced at the API layer, not just the UI layer. The agent UI not showing a "delete order" button is UX convenience. The API rejecting a delete request from an agent-scoped JWT is security. Both must exist.

**Permission escalation:** there is no self-serve role escalation. An agent cannot give themselves coordinator access. Role changes go through the manager and require an audit log entry.

**Audit log:** every state change (order confirmed, ticket state advanced, role change) is logged with: timestamp, actor user ID, the change made, the previous state. This log is append-only — no deletes, no edits.
