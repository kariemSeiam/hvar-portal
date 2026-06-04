## HVAR Backend API Reference (v2)

This document covers all public backend endpoints under `Hvar-Bosta-v2/`, with deep details on request/response schemas, validation rules, pagination, and examples.

### Conventions

- **Base URL**: `http://localhost:5000`
- **Common Prefix**: most endpoints are under `/api/...`
- **Content-Type**: `application/json`
- **CORS**: enabled (dev)
- **Authentication**: none (dev)
- **Date format**: ISO 8601 strings unless stated otherwise
- **Phone numbers**: normalized to Egyptian format; helper implicitly cleans (`+20`/`20`/`01` forms accepted)

### Standard Response Envelope

- All endpoints return an envelope created by `create_api_response(success, data?, error?, ...extra)`
- Keys:
  - `success`: boolean
  - `timestamp`: ISO string
  - `data`: any (present when successful)
  - `error`: string (present when failed)
  - `...extra`: optional (e.g., `pagination`, `message`, `total`)

Example (success):

```json
{
  "success": true,
  "timestamp": "2025-08-12T10:10:10.000Z",
  "data": { "key": "value" },
  "pagination": { "total": 123, "limit": 50, "offset": 0, "has_more": true }
}
```

Example (error):

```json
{
  "success": false,
  "timestamp": "2025-08-12T10:10:10.000Z",
  "error": "Missing required field: phone"
}
```

### Status Codes

- `200 OK`: success
- `201 Created`: resource created
- `400 Bad Request`: missing/invalid inputs
- `404 Not Found`: resource not found
- `410 Gone`: deprecated endpoint
- `500 Server Error`: unexpected failure

### Pagination Patterns

- Listing endpoints use either `limit/offset` or `page/limit` with a `pagination` object in the response.
- Common keys: `total`, `limit`, `offset`, `has_more` or `page`, `total_pages`.

### Phone Normalization

- The backend normalizes phones (removes non-digits; strips country code; ensures leading zero). Valid Egyptian mobiles are 11-digits starting with `01`.
- Invalid or missing phone inputs will be rejected or normalized to `'unknown'` → treated as invalid input.


## Health and Control

### GET `/health`

- Description: Service and database health.
- Response `data` includes: service `status`, database status (tables, sizes), version, timestamp.

### GET `/`

- Description: Root index with endpoint hints and sync status (running/stopped) plus DB status summary.

### GET `/api/sync/status`

- Description: Background sync (orders ingestion) status.
- Response keys: `sync_running`, `current_page`, `total_pages`, `processed_orders`, `last_sync`, `next_sync`.

### POST `/api/sync/start`

- Description: Start background sync. If already running, returns informative message.

### POST `/api/sync/stop`

- Description: Stop background sync. If not running, returns informative message.

### GET `/api/docs`

- Description: Dynamic docs endpoint. Returns generated docs or a fallback object with error and DB status.


## Orders API

Base: `/api/orders`

### GET `/api/orders`

- Description: List orders with analytics-aware filters and optional includes.
- Query params:
  - `date_from`, `date_to`: YYYY-MM-DD
  - `states` or `state_codes`: comma list, e.g. `45,46,48`
  - `types` or `order_types`: comma list of order type codes `10,20,25,30`
  - `categories` or `business_categories`: comma list of derived biz categories
  - `cod_range`: `"min,max"` (e.g. `-500,500`)
  - `cod_min`, `cod_max`: numeric
  - `city`, `phone`: string filters
  - `risk` or `risk_levels`: comma list
  - `limit` (<=1000), `offset`
  - `sort_by`: `created_at|cod|state_code|tracking_number|receiver_name|dropoff_city_name`
  - `sort_dir`: `ASC|DESC`
  - `include`: `service_actions,hierarchy,analytics` or `all`
- Response `data`:
  - `orders`: array of order objects
  - `pagination`: `total`, `limit`, `offset`, `has_more`
  - `analytics`: `total_orders`, `total_cod`, `avg_cod`, `state_distribution`, `category_distribution`
- Errors: `400` (invalid query), `500` (server)

Example:

```bash
curl "http://localhost:5000/api/orders?date_from=2025-01-01&date_to=2025-01-31&states=45,46&limit=50&include=all"
```

### GET `/api/orders/analytics`

- Description: Global analytics snapshot (state/type/revenue/risk) in optional window.
- Query: `date_from`, `date_to`, `granularity=daily|weekly|monthly`

### GET `/api/orders/states/distribution`

- Description: Distribution by `state_code` (delivered, returned, terminated).
- Query: `date_from`, `date_to`

### GET `/api/orders/business/counts`

- Description: Business-highlights counts.
- Buckets: `total`, `sales` (delivered, COD>500), `service` (<=500 incl. refunds), `returns`, `processing`, `problems`.

### GET `/api/orders/revenue/analysis`

- Description: Revenue analysis.
- Query: `date_from`, `date_to`, `breakdown_by=category|state|type`

### GET `/api/orders/<tracking_number>`

- Description: Single order by tracking number with business context.
- Query `include`: `service_actions,hierarchy,analytics` or `all`
- Errors: `404` if not found.

### POST `/api/orders/sync`

- Description: Intelligent order sync.
- Body:

```json
{ "type": "incremental|full|targeted", "order_types": ["all"], "priority_states": [45,46,48] }
```

### POST `/api/orders/process/batch`

- Description: Batch classify/process.
- Body:

```json
{ "orders": [ {"...order"}, {"..."} ], "mode": "standard|priority|background" }
```

### GET `/api/orders/business/categories`

- Description: Business category analysis over a period.

### GET `/api/orders/performance/metrics`

- Description: Performance KPIs. Query: `period`, `compare_to`.


## Unified Orders API

Base: `/api/unified-orders`

### GET `/api/unified-orders`

- Description: Unified orders with complete cycle integration.
- Query:
  - `cycle_type`: `normal|exchange|return_pickup|maintenance`
  - `processing_stage`: `intake|scanning|quality_check|service_action|maintenance|customer_service|return_processing|completion`
  - `include_pending`: `true|false`
  - `limit`, `offset`, `sort_by`, `sort_dir`
- Response: `orders[]`, `pagination`

### GET `/api/unified-orders/<tracking_number>`

- Description: Unified order details including service actions, hub workflows, maintenance cycles.
- Errors: `404` if not found.

### POST `/api/unified-orders/process`

- Description: Process a single order through full cycle.
- Body:

```json
{ "order_data": {"..."}, "cycle_type": "optional", "processing_mode": "standard|priority|critical" }
```

### POST `/api/unified-orders/process/batch`

- Description: Batch unified processing.
- Body: `{ "orders": [...], "max_workers": 5 }`

### GET cycle shortcuts

- `/api/unified-orders/exchange` — exchange orders
- `/api/unified-orders/return-pickup` — return pickup orders
- `/api/unified-orders/maintenance` — maintenance orders

### GET stage shortcuts

- `/api/unified-orders/scanning`
- `/api/unified-orders/quality-check`
- `/api/unified-orders/service-action`
- `/api/unified-orders/maintenance-stage`
- `/api/unified-orders/customer-service`
- `/api/unified-orders/return-processing`

### POST `/api/unified-orders/<tracking_number>/advance-stage`

- Description: Move order to a specific stage with optional payload.
- Body:

```json
{ "target_stage": "scanning|quality_check|service_action|maintenance|customer_service|return_processing", "stage_data": {"action_type": "maintenance"} }
```

### POST `/api/unified-orders/<tracking_number>/complete-cycle`

- Description: Mark order cycle as completed.
- Body: `{ "completion_notes": "...", "final_status": "completed|cancelled|failed" }`

### GET analytics

- `/api/unified-orders/analytics/cycle-distribution`
- `/api/unified-orders/analytics/processing-stages`


## Customers API

Base: `/api/customers`

### GET|POST `/api/customers/init`

- Description: Initialize customer management schema. Idempotent.

### GET `/api/customers/stats`

- Description: Segment-level stats and averages.

### GET `/api/customers`

- Description: List customers with filters.
- Query:
  - `segment`, `city`, `limit`, `offset`
  - `search` (matches full_name/first/last/phone)
  - `satisfaction_min`, `return_rate_max`
  - `order_count_min`, `lifetime_value_min`
  - `last_order_days`
  - `has_maintenance_orders=true|false`
  - `has_refunds=true|false`
- Response: `customers[]`, `pagination`

### GET `/api/customers/<phone>`

- Description: Customer by phone (original or normalized).
- Response `data` includes: `customer`, `order_analytics`, `addresses`, optional `analytics`, `recent_interactions`.
- Errors: not-found payload (HTTP 200 with `success:false`), or 404 in specific list endpoints.

### GET `/api/customers/<phone>/orders`

- Description: Customer orders with business categorization.
- Query: `page`, `limit`, `order_category`, `state`, `date_from`, `date_to`
- Response: `orders[]`, pagination
- Errors: `404` if customer not found

### GET `/api/customers/<phone>/interactions`

- Description: List interactions for customer.
- Query: `status`, `type`, `limit`, `offset`

### POST `/api/customers/<phone>/interactions`

- Description: Create interaction.
- Required: `interaction_type`, `channel`, `subject`
- Optional: `description`, `priority`, `assigned_agent`

### GET `/api/customers/segments`

- Description: Available segment definitions.

### GET `/api/customers/analytics`

- Description: Segment analytics with optional filters.
- Query: `segment`, `city`, `date_from`, `date_to`

### GET `/api/customers/realtime-analytics/<phone>`

- Description: Real-time analytics and health scores.

### POST `/api/customers/duplicates/detect`

- Description: Detect duplicate customers.
- Body:

```json
{ "similarity_threshold": 0.8, "auto_merge": false }
```

- Notes: when `auto_merge=true`, high-confidence duplicates (>=0.9) are merged automatically.

### POST `/api/customers/duplicates/merge`

- Description: Merge duplicates by IDs.
- Body:

```json
{ "primary_customer_id": 123, "duplicate_customer_ids": [456, 789] }
```

- Behavior: reassigns all `orders.receiver_phone`, merges `customer_addresses`, `customer_interactions`, `customer_service_queue`; updates aggregate metrics and analytics; deletes duplicate rows.

### POST `/api/customers/merge-by-phone`

- Description: Merge two customers using phones.
- Body:

```json
{ "primary_phone": "01123456789", "secondary_phone": "201123456789" }
```

- Behavior:
  - Normalizes both phones; rejects if equal post-normalization.
  - Looks up both customers; if either missing → error.
  - Delegates merging to existing merge service (moves orders/addresses/interactions/queues to primary, recomputes aggregates).
  - Chooses better display name between the two (non-empty > length > higher activity/value) and updates primary.

### POST `/api/customers/profile/update/<phone>`

- Description: Rebuild profile/analytics from most recent orders for this phone.

### POST `/api/customers/segments/update`

- Description: Update segments for customers with empty/NULL segments (idempotent bulk update).

### POST `/api/customers/create`

- Description: Create customer without any orders. Maps legacy keys to current schema.
- Body (flexible):

```json
{
  "phone": "01123456789",          
  "secondary_phone": "201123456789", 
  "first_name": "Ahmed",
  "last_name": "Ali",
  "full_name": "Ahmed Ali",        
  "name": "Ahmed Ali",             
  "city": "Cairo",                 
  "primary_city": "Cairo",         
  "zone": "Nasr City",             
  "primary_zone": "Nasr City",     
  "governorate": "Nasr City",      
  "district": "Area 10",           
  "primary_district": "Area 10",   
  "address": "Street 10, Block 5", 
  "street": "Street 10, Block 5",  
  "primary_address": "Street 10, Block 5"
}
```

- Validation & defaults:
  - Requires at least one valid phone after normalization (`phone` or `secondary_phone`).
  - Rejects if an existing customer with same phone exists.
  - Inserts with metrics: `total_orders=0`, `total_value=0`, `avg_order_value=0`, `customer_segment='new'`, `return_rate=0.0`, `satisfaction_score=0.5`.
  - Creates a primary address row if any of city/zone/district/address provided.

Example:

```bash
curl -X POST http://localhost:5000/api/customers/create \
  -H "Content-Type: application/json" \
  -d '{
    "phone":"01123456789",
    "first_name":"Ahmed",
    "last_name":"Ali",
    "city":"Cairo",
    "zone":"Nasr City",
    "address":"Street 10"
  }'
```


## Customer Service API

Base: `/api/customer-service`

### GET|POST `/api/customer-service/init`

- Description: Initialize customer service DB schema. Idempotent.

### GET `/api/customer-service/tickets`

- Description: List tickets.
- Query: `page`, `limit`, `status`, `ticket_type`, `priority`, `customer_phone`, `assigned_agent`
- Response: `tickets[]`, `pagination`

### POST `/api/customer-service/tickets`

- Description: Create ticket.
- Required fields: `customer_phone`, `ticket_type`, `subject`
- Response: `ticket_id`, `customer_info`

### GET `/api/customer-service/tickets/<ticket_id>`

- Description: Ticket details with related maintenance, replacements, hub confirmations, leader actions.
- Errors: `404` if not found

Deprecated (return `410 Gone`):

- POST `/api/customer-service/maintenance`
- PUT `/api/customer-service/maintenance/<cycle_id>/update`

Replacement Management:

- POST `/api/customer-service/replacements` — required: `customer_phone`, `replacement_type`, `replacement_reason`
- PUT `/api/customer-service/replacements/<replacement_id>/update` — updates allowed fields only

Hub Confirmation:

- POST `/api/customer-service/hub-confirmations` — required: `hub_name`, `hub_agent`, `confirmation_type`, `confirmation_date`
- PUT `/api/customer-service/hub-confirmations/<id>/confirm` — sets confirmation status and details

Team Leader Actions:

- POST `/api/customer-service/team-leader-actions` — required: `team_leader_name`, `action_type`, `action_date`
- PUT `/api/customer-service/team-leader-actions/<id>/complete`

Analytics & Dashboard:

- GET `/api/customer-service/analytics`
- GET `/api/customer-service/dashboard`


## Unified Customer Service API

Base: `/api/unified-service`

Service Actions:

- GET `/api/unified-service/service-actions` — filters: `customer_phone`, `action_status`, `action_type`, `priority`, `tracking_number`, `assigned_technician`, `date_from`, `date_to`; pagination
- POST `/api/unified-service/service-actions` — manual creation; required: `receiver_phone`, `action_type`
- GET `/api/unified-service/service-actions/<action_id>`
- PUT `/api/unified-service/service-actions/<action_id>/status` — body: `{ "new_status": "..." }`

Hub Operations:

- POST `/api/unified-service/hub/scan` — body: `{ "return_tracking_number": "...", "hub_agent": "...", "scan_notes": "..." }` — retries DB locks
- POST `/api/unified-service/hub/inspection` — body includes `return_tracking_number`, optional `product_condition`, `quality_score`, `inspection_notes`, `parts_inspection[]`, `hub_agent`

Follow-ups:

- GET `/api/unified-service/follow-ups` — filters: `priority`, `status`, `days_back`, `customer_phone`, `tracking_number`, `agent_name`, `follow_up_type`
- POST `/api/unified-service/follow-ups` — required: `customer_phone`, `follow_up_type`, `follow_up_date`, `follow_up_priority`, `agent_name`, `follow_up_notes`
- GET `/api/unified-service/follow-ups/<follow_up_id>`
- PUT `/api/unified-service/follow-ups/<follow_up_id>/complete` — requires `completion_notes`; optional `schedule_next`, `next_follow_up_date`, `next_follow_up_time`, `next_agent_name`
- POST `/api/unified-service/schedule-follow-up` — same as creating follow-up (form-specific)

Analytics & Dashboard:

- GET `/api/unified-service/analytics`
- GET `/api/unified-service/dashboard`


## Maintenance API

Base: `/api/maintenance`

Escalation Rules:

- GET `/api/maintenance/escalation-rules`
- PUT `/api/maintenance/escalation-rules/<rule_id>` — body: fields to update

Maintenance Cycles:

- POST `/api/maintenance/cycles` — required: `action_id`, `customer_phone`, `cycle_type`, `priority`; returns: `cycle_id`, `technician_assigned`, `parts_allocated`, `sla_deadlines`
- GET `/api/maintenance/cycles` — filters: `status`, `priority`, `maintenance_type`, `technician_id`, `date_from`, `date_to`; pagination
- GET `/api/maintenance/cycles/<cycle_id>` — details with SLA tracking, parts allocation, quality inspections
- POST `/api/maintenance/cycles/<cycle_id>/start`
- POST `/api/maintenance/cycles/<cycle_id>/complete`

Stock Integration:

- POST `/api/maintenance/cycles/<cycle_id>/stock/allocate` — body: `{ "parts_requirements": [...] }`
- POST `/api/maintenance/cycles/<cycle_id>/stock/usage` — body: `{ "usage_data": [...] }`
- POST `/api/maintenance/cycles/<cycle_id>/stock/returns` — body: `{ "return_data": [...] }`
- GET `/api/maintenance/stock/forecast` — query: `period=monthly|...`
- GET `/api/maintenance/stock/alerts`

SLA Monitoring:

- POST `/api/maintenance/sla/monitor/start`
- POST `/api/maintenance/sla/monitor/stop`
- POST `/api/maintenance/sla/violations/check`
- POST `/api/maintenance/sla/escalations/process`

Technicians:

- POST `/api/maintenance/technicians` — required: `technician_id`, `name`
- GET `/api/maintenance/technicians/<technician_id>/workload`
- GET `/api/maintenance/technicians/workload`

Analytics & Reports:

- GET `/api/maintenance/analytics` — simplified summary
- GET `/api/maintenance/analytics/performance` — comprehensive metrics
- GET `/api/maintenance/stock/summary` — maintenance stock overview
- GET `/api/maintenance/analytics/sla` — SLA performance report


## Products API

Base: `/api`

- GET `/api/products` — query: `page`, `limit`, `search`, `category`
- GET `/api/products/<product_id>`
- POST `/api/products` — required: `name_ar`
- PUT `/api/products/<product_id>`
- DELETE `/api/products/<product_id>`
- GET `/api/products/categories`
- GET `/api/products/<product_id>/inventory`
- POST `/api/products/<product_id>/inventory` — required: `location`, `quantity_change`, `transaction_type`; optional `reference_type`, `reference_id`, `notes`
- GET `/api/products/inventory/alerts`
- GET `/api/products/<product_id>/parts`
- GET `/api/products/parts`


## Error Cases and Validation Highlights

- Customers
  - Invalid phone → `400` error: `Valid phone number is required`
  - Duplicate phone on create → `400` with `existing_customer_*` hints
  - Merge-by-phone: same normalized numbers → `400`; primary/secondary not found → error

- Orders
  - Unknown sort fields are ignored (defaults applied)
  - Non-parseable filters are skipped
  - Detail endpoints return `404` when not found

- Unified Service / Maintenance
  - All creation endpoints validate required fields and return `400` if missing
  - Some hub endpoints retry on `database is locked`


## Examples (cURL)

Create customer (no orders):

```bash
curl -X POST http://localhost:5000/api/customers/create \
  -H "Content-Type: application/json" \
  -d '{
    "phone":"01123456789",
    "first_name":"Ahmed",
    "last_name":"Ali",
    "city":"Cairo",
    "zone":"Nasr City",
    "address":"Street 10"
  }'
```

Merge customers by phone:

```bash
curl -X POST http://localhost:5000/api/customers/merge-by-phone \
  -H "Content-Type: application/json" \
  -d '{"primary_phone":"01123456789","secondary_phone":"201123456789"}'
```

Advance unified order stage:

```bash
curl -X POST http://localhost:5000/api/unified-orders/123456789/advance-stage \
  -H "Content-Type: application/json" \
  -d '{"target_stage":"service_action","stage_data":{"action_type":"maintenance"}}'
```

Create service ticket:

```bash
curl -X POST http://localhost:5000/api/customer-service/tickets \
  -H "Content-Type: application/json" \
  -d '{"customer_phone":"01123456789","ticket_type":"maintenance","subject":"Device not working"}'
```

Create maintenance cycle:

```bash
curl -X POST http://localhost:5000/api/maintenance/cycles \
  -H "Content-Type: application/json" \
  -d '{"action_id":101,"customer_phone":"01123456789","cycle_type":"repair","priority":"high"}'
```

Create product:

```bash
curl -X POST http://localhost:5000/api/products \
  -H "Content-Type: application/json" \
  -d '{"name_ar":"منتج تجريبي"}'
```


## Notes

- Always check `success` before using `data`.
- For list endpoints, use `limit/offset` (or `page/limit`) to paginate consistently.
- When providing phones, prefer local 11-digit `01XXXXXXXXX`; the system also accepts `20...` and `+20...` and normalizes them.
- Deprecated endpoints return `410 Gone` with migration guidance.



