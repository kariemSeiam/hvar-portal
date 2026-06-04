# Filtered Tickets API Documentation

Complete reference guide for filtering tickets using the `GET /api/tickets/` endpoint.

## Base Endpoint

```
GET /api/tickets/
```

## Response Format

All requests return consistent pagination format:

```json
{
  "data": [...tickets...],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

## Query Parameters

| Parameter       | Type    | Description                                        | Example                                |
| --------------- | ------- | -------------------------------------------------- | -------------------------------------- |
| `status`        | string  | Single status or comma-separated multiple statuses | `CONFIRMED` or `CONFIRMED,PENDING`     |
| `service_type`  | string  | Filter by service type                             | `replacement`, `maintenance`, `return` |
| `customer_id`   | integer | Filter by specific customer                        | `123`                                  |
| `start_date`    | string  | Filter from date (YYYY-MM-DD)                      | `2025-01-01`                           |
| `end_date`      | string  | Filter until date (YYYY-MM-DD)                     | `2025-01-31`                           |
| `limit`         | integer | Number per page (default: 20)                      | `50`                                   |
| `offset`        | integer | Pagination offset (default: 0)                     | `20`                                   |
| `include_bosta` | boolean | Include Bosta data (default: true)                 | `false`                                |
| `force_sync`    | boolean | Force fresh Bosta sync (default: false)            | `true`                                 |

---

## Status Values

| Status               | Description                               |
| -------------------- | ----------------------------------------- |
| `PENDING`            | Initial status, awaiting confirmation     |
| `CONFIRMED`          | Ticket confirmed and ready for processing |
| `IN_PROCESS`         | Ticket is being worked on                 |
| `READY_FOR_DISPATCH` | Ready to be sent out                      |
| `SENT`               | Ticket has been sent                      |
| `RETURNED`           | Ticket/item has been returned             |
| `COMPLETED`          | Ticket is completed                       |
| `CANCELLED`          | Ticket has been cancelled                 |

## Service Type Values

| Service Type  | Description             |
| ------------- | ----------------------- |
| `replacement` | الاستبدال (Replacement) |
| `maintenance` | الصيانة (Maintenance)   |
| `return`      | الاسترجاع (Return)      |

---

## All Available Statuses by Service Type

This section shows all possible status values that can be used with each service type.

### Replacement (الاستبدال) - `service_type=replacement`

| Status               | API Endpoint Example                                                   | Description                      |
| -------------------- | ---------------------------------------------------------------------- | -------------------------------- |
| `CONFIRMED`          | `GET /api/tickets/?status=CONFIRMED&service_type=replacement`          | Confirmed, ready for preparation |
| `IN_PROCESS`         | `GET /api/tickets/?status=IN_PROCESS&service_type=replacement`         | Currently being prepared         |
| `READY_FOR_DISPATCH` | `GET /api/tickets/?status=READY_FOR_DISPATCH&service_type=replacement` | Ready to be shipped              |
| `SENT`               | `GET /api/tickets/?status=SENT&service_type=replacement`               | Has been sent                    |
| `RETURNED`           | `GET /api/tickets/?status=RETURNED&service_type=replacement`           | Returned for validation          |
| `COMPLETED`          | `GET /api/tickets/?status=COMPLETED&service_type=replacement`          | Ticket completed                 |
| `CANCELLED`          | `GET /api/tickets/?status=CANCELLED&service_type=replacement`          | Ticket cancelled                 |

**Note:** `PENDING` status is not typically used for replacement tickets.

### Maintenance (الصيانة) - `service_type=maintenance`

| Status               | API Endpoint Example                                                   | Description                    |
| -------------------- | ---------------------------------------------------------------------- | ------------------------------ |
| `PENDING`            | `GET /api/tickets/?status=PENDING&service_type=maintenance`            | Awaiting confirmation          |
| `CONFIRMED`          | `GET /api/tickets/?status=CONFIRMED&service_type=maintenance`          | Confirmed, ready for receiving |
| `IN_PROCESS`         | `GET /api/tickets/?status=IN_PROCESS&service_type=maintenance`         | Received or under maintenance  |
| `READY_FOR_DISPATCH` | `GET /api/tickets/?status=READY_FOR_DISPATCH&service_type=maintenance` | Ready to be shipped            |
| `SENT`               | `GET /api/tickets/?status=SENT&service_type=maintenance`               | Has been sent                  |
| `COMPLETED`          | `GET /api/tickets/?status=COMPLETED&service_type=maintenance`          | Ticket completed               |
| `CANCELLED`          | `GET /api/tickets/?status=CANCELLED&service_type=maintenance`          | Ticket cancelled               |

**Note:** `RETURNED` status is not typically used for maintenance tickets.

### Return (الاسترجاع) - `service_type=return`

| Status       | API Endpoint Example                                      | Description                    |
| ------------ | --------------------------------------------------------- | ------------------------------ |
| `CONFIRMED`  | `GET /api/tickets/?status=CONFIRMED&service_type=return`  | Confirmed, ready for receiving |
| `IN_PROCESS` | `GET /api/tickets/?status=IN_PROCESS&service_type=return` | Under inspection               |
| `COMPLETED`  | `GET /api/tickets/?status=COMPLETED&service_type=return`  | Ticket completed               |
| `CANCELLED`  | `GET /api/tickets/?status=CANCELLED&service_type=return`  | Ticket cancelled               |

**Note:** `PENDING`, `READY_FOR_DISPATCH`, `SENT`, and `RETURNED` statuses are not typically used for return tickets.

---

## All Available Actions by Service Type and Status

This section shows all possible `available_actions` that can appear for each service type and status combination. Actions are used for client-side filtering.

### Replacement (الاستبدال) - `service_type=replacement`

| Status               | Available Actions              | Client-Side Filter Example                           | Description                          |
| -------------------- | ------------------------------ | ---------------------------------------------------- | ------------------------------------ |
| `CONFIRMED`          | `start_preparation`, `cancel`  | `t.available_actions.includes('start_preparation')`  | Can start preparing replacement      |
| `IN_PROCESS`         | `ready_for_dispatch`, `cancel` | `t.available_actions.includes('ready_for_dispatch')` | Can mark ready for dispatch          |
| `READY_FOR_DISPATCH` | `scan_outbound`, `cancel`      | `t.available_actions.includes('scan_outbound')`      | Can scan outbound shipment           |
| `SENT`               | `scan_inbound`, `cancel`       | `t.available_actions.includes('scan_inbound')`       | Can scan inbound return              |
| `RETURNED`           | `validate_items`, `cancel`     | `t.available_actions.includes('validate_items')`     | Can validate returned items          |
| `COMPLETED`          | `[]` (no actions)              | N/A                                                  | Terminal state, no actions available |
| `CANCELLED`          | `[]` (no actions)              | N/A                                                  | Terminal state, no actions available |

**Note:** `PENDING` status is not typically used for replacement tickets. If used, it would have: `confirm`, `cancel`.

### Maintenance (الصيانة) - `service_type=maintenance`

| Status               | Available Actions          | Client-Side Filter Example                       | Description                          |
| -------------------- | -------------------------- | ------------------------------------------------ | ------------------------------------ |
| `PENDING`            | `confirm`, `cancel`        | `t.available_actions.includes('confirm')`        | Can confirm ticket                   |
| `CONFIRMED`          | `scan_inbound`, `cancel`   | `t.available_actions.includes('scan_inbound')`   | Can scan inbound item                |
| `IN_PROCESS`         | See notes below            | See filter examples below                        | Varies based on maintenance progress |
| `READY_FOR_DISPATCH` | `scan_outbound`, `cancel`  | `t.available_actions.includes('scan_outbound')`  | Can scan outbound shipment           |
| `SENT`               | `mark_delivered`, `cancel` | `t.available_actions.includes('mark_delivered')` | Can mark as delivered                |
| `COMPLETED`          | `[]` (no actions)          | N/A                                              | Terminal state, no actions available |
| `CANCELLED`          | `[]` (no actions)          | N/A                                              | Terminal state, no actions available |

#### IN_PROCESS Status Actions (Maintenance)

The `IN_PROCESS` status for maintenance has dynamic actions based on maintenance progress:

| Maintenance State | Available Actions                | Client-Side Filter Example                                                                                   | Description                  |
| ----------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------ | ---------------------------- |
| Not started       | `start_maintenance`, `cancel`    | `t.available_actions.includes('start_maintenance') && !t.available_actions.includes('complete_maintenance')` | Maintenance not yet started  |
| In progress       | `complete_maintenance`, `cancel` | `t.available_actions.includes('complete_maintenance') && !t.available_actions.includes('mark_ready')`        | Maintenance in progress      |
| Completed (ready) | `mark_ready`, `cancel`           | `t.available_actions.includes('mark_ready')`                                                                 | Maintenance completed, ready |

**Filter Examples:**

```javascript
// Get maintenance tickets that can start maintenance (received, not started)
GET /api/tickets/?status=IN_PROCESS&service_type=maintenance&limit=100
// Then filter client-side:
tickets.filter(t =>
  t.available_actions.includes('start_maintenance') &&
  !t.available_actions.includes('complete_maintenance')
)

// Get maintenance tickets under maintenance (started but not completed)
GET /api/tickets/?status=IN_PROCESS&service_type=maintenance&limit=100
// Then filter client-side:
tickets.filter(t =>
  t.available_actions.includes('complete_maintenance') &&
  !t.available_actions.includes('mark_ready')
)

// Get maintenance tickets ready for completion
GET /api/tickets/?status=IN_PROCESS&service_type=maintenance&limit=100
// Then filter client-side:
tickets.filter(t => t.available_actions.includes('mark_ready'))
```

### Return (الاسترجاع) - `service_type=return`

| Status       | Available Actions          | Client-Side Filter Example                       | Description             |
| ------------ | -------------------------- | ------------------------------------------------ | ----------------------- |
| `CONFIRMED`  | `scan_inbound`, `cancel`   | `t.available_actions.includes('scan_inbound')`   | Can scan inbound return |
| `IN_PROCESS` | `validate_items`, `cancel` | `t.available_actions.includes('validate_items')` | Can validate items      |
| `COMPLETED`  | `[]` (no actions)          | N/A                                              | Terminal state          |
| `CANCELLED`  | `[]` (no actions)          | N/A                                              | Terminal state          |

**Note:** `PENDING` status is not typically used for return tickets. If used, it would have: `confirm`, `cancel`.

---

## Complete Action Reference

### All Available Actions

| Action                 | Service Types                               | Description                         |
| ---------------------- | ------------------------------------------- | ----------------------------------- |
| `confirm`              | All (when PENDING)                          | Confirm a pending ticket            |
| `start_preparation`    | Replacement (CONFIRMED)                     | Start preparing replacement item    |
| `ready_for_dispatch`   | Replacement (IN_PROCESS)                    | Mark replacement ready for dispatch |
| `scan_outbound`        | Replacement, Maintenance                    | Scan outbound shipment              |
| `scan_inbound`         | Replacement, Maintenance, Return            | Scan inbound item/return            |
| `validate_items`       | Replacement (RETURNED), Return (IN_PROCESS) | Validate returned items             |
| `start_maintenance`    | Maintenance (IN_PROCESS)                    | Start maintenance work              |
| `complete_maintenance` | Maintenance (IN_PROCESS)                    | Complete maintenance work           |
| `mark_ready`           | Maintenance (IN_PROCESS)                    | Mark maintenance ready for dispatch |
| `mark_delivered`       | Maintenance (SENT)                          | Mark maintenance as delivered       |
| `cancel`               | All (except COMPLETED, CANCELLED)           | Cancel ticket                       |

---

## Basic Filtering Examples

### Filter by Status

```javascript
// Single status
GET /api/tickets/?status=CONFIRMED

// Multiple statuses (comma-separated)
GET /api/tickets/?status=CONFIRMED,PENDING
GET /api/tickets/?status=SENT,RETURNED
```

### Filter by Service Type

```javascript
// Replacement tickets
GET /api/tickets/?service_type=replacement

// Maintenance tickets
GET /api/tickets/?service_type=maintenance

// Return tickets
GET /api/tickets/?service_type=return
```

### Combine Status and Service Type

```javascript
// Confirmed replacement tickets
GET /api/tickets/?status=CONFIRMED&service_type=replacement

// In-process maintenance tickets
GET /api/tickets/?status=IN_PROCESS&service_type=maintenance

// Completed return tickets
GET /api/tickets/?status=COMPLETED&service_type=return
```

### Filter by Date Range

```javascript
// Tickets from January 2025
GET /api/tickets/?start_date=2025-01-01&end_date=2025-01-31

// Tickets from last 7 days
GET /api/tickets/?start_date=2025-01-20&end_date=2025-01-27

// Combined with service type
GET /api/tickets/?service_type=replacement&start_date=2025-01-01&end_date=2025-01-31
```

### Filter by Customer

```javascript
// All tickets for a specific customer
GET /api/tickets/?customer_id=123

// Combined with status
GET /api/tickets/?customer_id=123&status=CONFIRMED
```

### Get All Tickets (No Filters)

```javascript
// Dashboard view - all tickets
GET /api/tickets/?limit=100
```

---

## Common Filter Combinations

### Replacement Tickets

```javascript
// Confirmed replacements (new tickets)
GET /api/tickets/?status=CONFIRMED&service_type=replacement

// In-process replacements (being prepared)
GET /api/tickets/?status=IN_PROCESS&service_type=replacement

// Ready to ship replacements
GET /api/tickets/?status=READY_FOR_DISPATCH&service_type=replacement

// Sent replacements
GET /api/tickets/?status=SENT&service_type=replacement

// Returned replacements (for validation)
GET /api/tickets/?status=RETURNED&service_type=replacement

// Completed replacements
GET /api/tickets/?status=COMPLETED&service_type=replacement

// Cancelled replacements
GET /api/tickets/?status=CANCELLED&service_type=replacement
```

### Maintenance Tickets

```javascript
// Confirmed or pending maintenance
GET /api/tickets/?status=CONFIRMED,PENDING&service_type=maintenance

// In-process maintenance (received or under maintenance)
GET /api/tickets/?status=IN_PROCESS&service_type=maintenance

// Ready to ship maintenance
GET /api/tickets/?status=READY_FOR_DISPATCH&service_type=maintenance

// Sent maintenance
GET /api/tickets/?status=SENT&service_type=maintenance

// Completed maintenance
GET /api/tickets/?status=COMPLETED&service_type=maintenance

// Cancelled maintenance
GET /api/tickets/?status=CANCELLED&service_type=maintenance
```

### Return Tickets

```javascript
// Confirmed returns (receiving)
GET /api/tickets/?status=CONFIRMED&service_type=return

// In-process returns (inspection)
GET /api/tickets/?status=IN_PROCESS&service_type=return

// Completed returns
GET /api/tickets/?status=COMPLETED&service_type=return

// Cancelled returns
GET /api/tickets/?status=CANCELLED&service_type=return
```

---

## Client-Side Filtering with available_actions

Some filters require additional client-side filtering based on the `available_actions` field, which is calculated dynamically based on ticket state.

### Client-Side Filter Examples

```javascript
// Example: Get tickets that can start preparation
GET /api/tickets/?status=CONFIRMED&service_type=replacement&limit=100
// Then filter client-side:
tickets.filter(t => t.available_actions.includes('start_preparation'))

// Example: Get tickets ready for dispatch
GET /api/tickets/?status=IN_PROCESS&service_type=replacement&limit=100
// Then filter client-side:
tickets.filter(t => t.available_actions.includes('ready_for_dispatch'))

// Example: Get tickets that can start maintenance
GET /api/tickets/?status=IN_PROCESS&service_type=maintenance&limit=100
// Then filter client-side:
tickets.filter(t =>
  t.available_actions.includes('start_maintenance') &&
  !t.available_actions.includes('complete_maintenance')
)

// Example: Get tickets under maintenance
GET /api/tickets/?status=IN_PROCESS&service_type=maintenance&limit=100
// Then filter client-side:
tickets.filter(t => t.available_actions.includes('complete_maintenance'))

// Example: Get tickets ready for completion
GET /api/tickets/?status=IN_PROCESS&service_type=maintenance&limit=100
// Then filter client-side:
tickets.filter(t => t.available_actions.includes('mark_ready'))
```

**Note:** Client-side filtering is necessary because `available_actions` is calculated dynamically and cannot be filtered server-side.

---

## Pagination

Use `limit` and `offset` parameters for pagination:

```javascript
// First page (20 tickets)
GET /api/tickets/?status=IN_PROCESS&limit=20&offset=0

// Second page
GET /api/tickets/?status=IN_PROCESS&limit=20&offset=20

// Third page
GET /api/tickets/?status=IN_PROCESS&limit=20&offset=40
```

---

## Performance Optimization

### Skip Bosta Data

If you don't need Bosta order data, set `include_bosta=false` for faster responses:

```javascript
GET /api/tickets/?status=CONFIRMED&include_bosta=false
```

### Force Fresh Bosta Sync

If you need the latest Bosta data, set `force_sync=true`:

```javascript
GET /api/tickets/?status=SENT&force_sync=true
```

### Limit Results

Always set an appropriate `limit` to avoid fetching too much data:

```javascript
// Good: Limited to 50 tickets
GET /api/tickets/?status=CONFIRMED&limit=50

// Avoid: No limit (might fetch thousands)
GET /api/tickets/?status=CONFIRMED
```

---

## Frontend Implementation Examples

### Basic Fetch Function

```javascript
async function fetchFilteredTickets(filters = {}) {
  const params = new URLSearchParams();

  if (filters.status) params.append("status", filters.status);
  if (filters.serviceType) params.append("service_type", filters.serviceType);
  if (filters.customerId) params.append("customer_id", filters.customerId);
  if (filters.startDate) params.append("start_date", filters.startDate);
  if (filters.endDate) params.append("end_date", filters.endDate);
  if (filters.limit) params.append("limit", filters.limit);
  if (filters.offset) params.append("offset", filters.offset);
  if (filters.includeBosta === false) params.append("include_bosta", "false");
  if (filters.forceSync) params.append("force_sync", "true");

  const response = await fetch(`/api/tickets/?${params.toString()}`);
  const { data: tickets, pagination } = await response.json();

  return { tickets, pagination };
}
```

### Usage Examples

```javascript
// Fetch confirmed replacement tickets
const { tickets, pagination } = await fetchFilteredTickets({
  status: "CONFIRMED",
  serviceType: "replacement",
  limit: 100,
});

// Fetch with client-side filtering
const { tickets, pagination } = await fetchFilteredTickets({
  status: "CONFIRMED",
  serviceType: "replacement",
  limit: 100,
});

const filteredTickets = tickets.filter((ticket) =>
  ticket.available_actions.includes("start_preparation")
);

// Fetch maintenance tickets with multiple statuses
const { tickets, pagination } = await fetchFilteredTickets({
  status: "CONFIRMED,PENDING",
  serviceType: "maintenance",
  limit: 50,
});

// Fetch tickets by date range
const { tickets, pagination } = await fetchFilteredTickets({
  startDate: "2025-01-01",
  endDate: "2025-01-31",
  limit: 100,
});
```
