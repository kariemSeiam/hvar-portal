# Backend (Flask)

REST API: auth, tickets, hub scan, stock, customers, Bosta, ERP. MySQL. Single process or gunicorn.

---

## Layout

| Path | Role |
|------|------|
| `api/` | Blueprints: service_api, hub_api, stock_api, customer_api, bosta_api, erp_api |
| `services/` | Business logic: service_manager, stock_manager, tracking_manager, bosta_service |
| `models/` | DB access: service_ticket, stock, customer, bosta_order, tracking |
| `utils/` | db, validators, responses, pagination, errors, phone_normalizer, bosta_converter |
| `config.py` | App config, env loading |

---

## Entry

`run.py` (root) or `gunicorn wsgi:app`. Port 5050 default.

---

## Docs

[docs/INDEX.md](../docs/INDEX.md) · [docs/system/api_endpoints.md](../docs/system/api_endpoints.md) · [docs/hub/service_tickets.md](../docs/hub/service_tickets.md) · [docs/system/stock.md](../docs/system/stock.md) · [docs/system/customer.md](../docs/system/customer.md)
