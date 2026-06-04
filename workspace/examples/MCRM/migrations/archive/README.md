# Archived Migrations

These migrations are superseded by `004_production_to_current.sql`. Kept for reference only.

| File | Content |
|------|---------|
| 002_add_order_description.sql | order_description column on orders |
| 003_add_completed_to_calls_status.sql | 'completed' in calls.status ENUM |
| 003_add_sell_service_type.sql | customer_type, price_customer, price_merchant |
| 004_orders_and_calls.sql | orders, calls tables; created_from_order_id |
| 005_leader_workflow.sql | approved_by, approved_at, confirmation_snapshot |
| 006_dedupe_orders_erp.sql | Unique index on erp_order_id |
| 007_add_in_erp.sql | in_erp column |
| 008_remove_escalated_status.sql | Migrate escalated → new |
| 009_users_and_auth.sql | users table, agent_name on calls |

Do not run these directly. Use `004_production_to_current.sql` for production deploy.
