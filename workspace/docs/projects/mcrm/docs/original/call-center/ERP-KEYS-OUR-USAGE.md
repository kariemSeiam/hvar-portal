# ERP draft-dt keys → what we use (backend + frontend)

For each of the 30 ERP keys in the draft-dt response, this doc shows: **backend usage** (sync, DB, API) and **frontend usage** (call-center UI).  
Source: `_erp_row_to_order` in `app/api/call_center_api.py`, `app/models/order.py`, `front/src/api/callCenterAPI.js`, and call-center components.

---

## Summary table


| ERP key                                    | Backend (sync / DB / API)                                   | Frontend                                                                                                                                                                       |
| ------------------------------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **invoice_no**                             | → `erp_order_id` (DB); dedup by `get_order_by_erp_order_id` | `order_number` (OrdersTable, FAB, confirm flow)                                                                                                                                |
| **mobile**                                 | → `customer_phone` (DB); normalized                         | `customer.phone`, search, call session, Bosta match                                                                                                                            |
| **contact_name_text**                      | → `customer_name` (DB)                                      | `customer.name`, display, confirm, customer match                                                                                                                              |
| **shipping_address**                       | → `delivery_address` (DB)                                   | `address_full`; FAB address chip; confirm snapshot                                                                                                                             |
| **shipping_state**                         | → `governorate` (DB)                                        | `address_governorate`; filters; FAB; OrdersTable                                                                                                                               |
| **shipping_city**                          | → `city` (DB)                                               | `address_city`; FAB; OrdersTable; confirm                                                                                                                                      |
| **shipping_details**                       | → `order_description` (DB) at sync; confirm can update      | Notes chip and FAB use `order_description`; address stays in `address_full`                                                                                                    |
| **final_total**                            | Parsed (`data-orig-value`) → `cod_amount` (DB)              | `cod_amount`; confirm; leader-approve                                                                                                                                          |
| **total_items**                            | Requested in ERP params; **not stored** in `orders`         | — (ERP only; items in confirmation_snapshot after confirm)                                                                                                                     |
| **total_quantity**                         | **Not stored** in `orders`                                  | Used in **raw ERP→call-center** map as `items_count` (`callCenterAPI.mapErpOrderToCallCenterOrder`)                                                                            |
| **transaction_date**                       | Requested in ERP params; **not stored**                     | —                                                                                                                                                                              |
| **contact_name** (HTML)                    | Not used (we use `contact_name_text`)                       | —                                                                                                                                                                              |
| **contact_id**                             | Not stored                                                  | —                                                                                                                                                                              |
| **DT_RowAttr**                             | Not used                                                    | —                                                                                                                                                                              |
| **action**                                 | Not used                                                    | —                                                                                                                                                                              |
| **added_by**                               | Not stored                                                  | —                                                                                                                                                                              |
| **business_location**                      | In ERP request columns; not stored                          | —                                                                                                                                                                              |
| **commission_agent**                       | In ERP request columns; not stored                          | —                                                                                                                                                                              |
| **commission_agent_name**                  | Not stored                                                  | —                                                                                                                                                                              |
| **coupon_code**                            | In ERP request columns; not stored                          | —                                                                                                                                                                              |
| **is_direct_sale**, **is_export**          | Not stored                                                  | —                                                                                                                                                                              |
| **marketing_source**                       | Not stored                                                  | —                                                                                                                                                                              |
| **postpone_button**, **postponed_***       | Not stored                                                  | —                                                                                                                                                                              |
| **sub_status**, **supplier_business_name** | Not stored                                                  | —                                                                                                                                                                              |


---

## Backend usage (per key we use)

### 1. invoice_no

- **Sync** (`_erp_row_to_order`): `erp_order_id = str(invoice_no)`.  
- **DB**: `orders.erp_order_id` (unique for dedup).  
- **API**: `get_order_by_erp_order_id(invoice_no)`; list/pending return `erp_order_id`.

### 2. mobile

- **Sync**: `customer_phone = str(mobile).strip()` (with fallbacks from `contacts` / `whatsapp`).  
- **DB**: `orders.customer_phone` (normalized via `normalize_phone_safe` on create/update).  
- **API**: list orders, get order, confirm, leader-approve; filter/search by phone.

### 3. contact_name_text

- **Sync**: `customer_name = str(contact_name_text)` (fallbacks: `contact_name`, `name`).  
- **DB**: `orders.customer_name`.  
- **API**: returned in every order response; used in confirm/leader-approve.

### 4. shipping_address

- **Sync**: `delivery_address = str(addr)` (fallback: `delivery_address`).  
- **DB**: `orders.delivery_address`.  
- **API**: returned in list/get; confirm/leader-approve use it; confirmation_snapshot stores it as `delivery_address`.

### 5. shipping_state

- **Sync**: `governorate = str(gov)` (fallback: `governorate`).  
- **DB**: `orders.governorate`.  
- **API**: list (filter by `governorate`); confirm/leader-approve; snapshot.

### 6. shipping_city

- **Sync**: `city = str(city)` (fallback: `city`).  
- **DB**: `orders.city`.  
- **API**: list, get, confirm, leader-approve, snapshot.

### 7. final_total

- **Sync**: parsed from HTML `data-orig-value` (or `cod_amount`/`cod`/`total`) → `cod_amount` (float).  
- **DB**: `orders.cod_amount`.  
- **API**: returned; confirm/leader-approve; float in JSON.

### 8. shipping_details (ERP items text)

- **Sync**: stored in `orders.order_description` (from ERP `shipping_details`).  
- **API**: list_orders / get order return `order_description`. Confirm-by-customer can update it from payload.  
- **Frontend**: Notes chip and FAB show `order_description`; no longer fallback to address.

### 9. total_items / total_quantity

- **Sync**: **not stored**. ERP sends them; we don’t persist.  
- **Frontend**: `mapErpOrderToCallCenterOrder` uses `total_quantity` for `items_count` when mapping a **raw ERP order** to call-center shape (e.g. for display before sync).

### 10. Other ERP keys (not used by our server)

- **contact_id**, **contact_name** (HTML), **DT_RowAttr**, **action**, **added_by**, **business_location**, **commission_agent**, **commission_agent_name**, **coupon_code**, **is_direct_sale**, **is_export**, **marketing_source**, **postpone_button**, **postponed_at**, **postponed_days**, **postponed_status**, **postponed_to**, **sub_status**, **supplier_business_name**, **transaction_date**: used only in ERP request column names or not at all; **no DB column, no API field**.

---

## Frontend usage (per our field)

Our **backend** returns orders with: `id`, `erp_order_id`, `customer_phone`, `customer_name`, `delivery_address`, `governorate`, `city`, `order_description`, `cod_amount`, `status`, `bosta_tracking`, etc. `order_description` is from ERP `shipping_details` (items text).


| Our field (from API)                        | Frontend mapping                                   | Where used                                                                                                                                                                                                                             |
| ------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **erp_order_id**                            | `order_number`                                     | `callCenterAPI.mapOrderFromBackend`; OrdersTable; CallSessionFAB; confirm flow; invoice label                                                                                                                                          |
| **customer_phone**                          | `customer.phone`, search, call                     | OrdersTable; CallSessionFAB; CallSessionPage; InquiriesTable; createDirectOrder; askOnly; Bosta match; confirm payload                                                                                                                 |
| **customer_name**                           | `customer.name`                                    | mapOrderFromBackend; OrdersTable; CallSessionFAB; confirm; leader-approve; customer match (sync-from-erp flow: `contact_name` / `contact_name_text` from ERP row)                                                                      |
| **delivery_address**                        | `address_full`, `order_description` fallback       | mapOrderFromBackend: `order_description: row.order_description || row.delivery_address` (so for synced orders “notes” = address); `address_full`; FAB address chip; OrdersTable; confirm snapshot                                      |
| **governorate**                             | `address_governorate`                              | mapOrderFromBackend; OrdersTable; CallSessionFAB; CallSessionPage; orderCardUtils; confirm; governorate filter                                                                                                                         |
| **city**                                    | `address_city`                                     | mapOrderFromBackend; CallSessionFAB; CallSessionPage; confirm                                                                                                                                                                          |
| **cod_amount**                              | `cod_amount`                                       | mapOrderFromBackend; confirm; display                                                                                                                                                                                                  |
| **order_description**                       | Not in DB                                          | Frontend expects it: `row.order_description || row.delivery_address` → so synced orders show delivery_address as “description/notes”. Real ERP `shipping_details` only when we pass raw ERP row (e.g. `mapErpOrderToCallCenterOrder`). |
| **shipping_details** (UI)                   | Same as `order_description` in mapOrderFromBackend | OrdersTable notes chip: `order.shipping_details`; tooltip/title; getShortNotes. So for synced orders = delivery_address.                                                                                                               |
| **bosta_tracking**                          | `bosta_tracking_number`                            | OrdersTable; FAB; Bosta search                                                                                                                                                                                                         |
| **status**, **confirmation_snapshot**, etc. | Various                                            | Status chips; confirm modal; leader-approve; parseConfirmationSnapshot for items/notes                                                                                                                                                 |


---

## File reference


| Layer                  | File                                                           | What it does                                                                                                                                                                                       |
| ---------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend sync           | `app/api/call_center_api.py`                                   | `_erp_row_to_order(row)` maps ERP keys → order dict; `_build_erp_draft_params` asks for columns including invoice_no, mobile, contact_name, shipping_*, total_items, etc.                          |
| Backend DB             | `app/models/order.py`                                          | `create_order` cols include order_description (from ERP shipping_details).                                                                                                                          |
| Frontend map (our API) | `front/src/api/callCenterAPI.js`                               | `mapOrderFromBackend(row)` → order_number, address_full, shipping_details (from order_description only; address in address_full), address_governorate, address_city, customer.name/phone.             |
| Frontend map (raw ERP) | `front/src/api/callCenterAPI.js`                               | `mapErpOrderToCallCenterOrder(erpOrder)` uses: invoice_no, contact_name_text, mobile, shipping_state, shipping_city, shipping_address, shipping_details, total_quantity → for display before sync. |
| UI                     | `OrdersTable.jsx`, `CallSessionFAB.jsx`, `CallSessionPage.jsx` | Order number, customer, address, governorate, city, shipping_details (notes chip), cod, status.                                                                                                    |


---

## Takeaway

- **Stored from ERP (8 keys):** invoice_no, mobile, contact_name_text, shipping_address, shipping_state, shipping_city, **shipping_details**, final_total → erp_order_id, customer_phone, customer_name, delivery_address, governorate, city, **order_description**, cod_amount.  
- **Used only when handling raw ERP row:** total_quantity (as items_count).  
- **Not used:** the other 21 ERP keys.  
- **Note:** ERP `shipping_details` is stored as `order_description`; notes chip and FAB show items text. After sync the frontend “notes”/shipping_details for that order are actually `delivery_address`. Run migration `003_add_order_description.sql` if the column is missing.

