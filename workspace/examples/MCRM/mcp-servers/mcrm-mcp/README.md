# HUB-MCRM MCP Server

Complete MCP server exposing every HUB-MCRM API endpoint as an individual tool.

## Setup

```bash
cd /root/Hvar-Hub/mcp-servers/mcrm-mcp
pip install -e .
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `MCRM_API_URL` | `https://mcrm.hvarstore.com` | MCRM API base URL |
| `MCRM_ADMIN_PHONE` | `01033939828` | Admin phone for X-User-Phone header |

## Run

```bash
python server.py
```

## Tools (67 total)

### Health (2)
- `mcrm_health` — API health check
- `mcrm_db_health` — Database connectivity check

### Auth (7)
- `mcrm_login` — User authentication
- `mcrm_register` — User registration
- `mcrm_list_users` — List all users (admin)
- `mcrm_create_user` — Create user (admin)
- `mcrm_delete_user` — Delete user (admin)
- `mcrm_update_user_role` — Update user role (admin)
- `mcrm_reset_user_password` — Reset password (admin)

### Customers (5)
- `mcrm_list_customers` — List customers
- `mcrm_create_customer` — Create customer
- `mcrm_search_customers` — Search customers
- `mcrm_get_customer` — Get customer by ID
- `mcrm_update_customer` — Update customer

### Tickets (11)
- `mcrm_create_ticket` — Create service ticket
- `mcrm_list_tickets` — List tickets with filters
- `mcrm_get_ticket_counts` — Ticket counts by status
- `mcrm_get_ticket` — Get ticket by ID
- `mcrm_get_ticket_history` — Ticket status history
- `mcrm_confirm_ticket` — Confirm/approve ticket
- `mcrm_cancel_ticket` — Cancel ticket
- `mcrm_delete_ticket` — Delete ticket
- `mcrm_get_ticket_actions` — Available actions
- `mcrm_execute_ticket_action` — Execute action
- `mcrm_filter_tickets` — Advanced filtering

### Hub (7)
- `mcrm_scan_tracking` — Scan tracking number
- `mcrm_receive_package` — Receive package
- `mcrm_dispatch_package` — Dispatch package
- `mcrm_get_workshop_queue` — Workshop queue
- `mcrm_get_pending_dispatch_queue` — Pending dispatch
- `mcrm_complete_maintenance` — Complete maintenance
- `mcrm_mark_ready` — Mark ready for dispatch

### Stock (11)
- `mcrm_list_stock_items` — List stock items
- `mcrm_create_stock_item` — Create stock item
- `mcrm_get_stock_item` — Get stock item
- `mcrm_update_stock_item` — Update stock item
- `mcrm_delete_stock_item` — Delete stock item
- `mcrm_adjust_stock_quantity` — Adjust quantity
- `mcrm_add_product_component` — Add BOM component
- `mcrm_remove_product_component` — Remove BOM component
- `mcrm_manual_stock_adjustment` — Manual adjustment
- `mcrm_list_stock_movements` — Movement history
- `mcrm_export_stock` — Export stock

### Bosta (5)
- `mcrm_bosta_search` — Search deliveries
- `mcrm_bosta_get_order` — Get order by tracking
- `mcrm_bosta_customer_orders` — Customer orders
- `mcrm_bosta_customer_sync` — Sync customer data
- `mcrm_bosta_health` — Bosta health check

### Call Center (16)
- `mcrm_cc_health` — Call center health
- `mcrm_cc_create_order` — Create order
- `mcrm_cc_list_orders` — List orders
- `mcrm_cc_order_dates` — Dates with data
- `mcrm_cc_order_counts` — Order counts
- `mcrm_cc_get_order` — Get order
- `mcrm_cc_sync_from_erp` — Sync from ERP
- `mcrm_cc_confirm_by_customer` — Confirm order
- `mcrm_cc_leader_approve` — Leader approve
- `mcrm_cc_leader_reject` — Leader reject
- `mcrm_cc_schedule_order` — Schedule callback
- `mcrm_cc_no_answer` — Log no answer
- `mcrm_cc_cancel_order` — Cancel order
- `mcrm_cc_list_pending` — Pending approvals
- `mcrm_cc_list_calls` — Call history
- `mcrm_cc_ask_only` — Log ask-only call

### ERP (1)
- `mcrm_erp_get_drafts` — ERP draft orders

## Resources
- `mcrm://manifest` — Full API manifest JSON
- `mcrm://health` — Live health check
