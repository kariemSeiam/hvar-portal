# API Endpoints

## Auth API (`/api/auth`)

- `POST` /api/auth/login — Username/password login (body: `{ username, password }`); returns `{ user, token }`
- `GET` /api/auth/me — Current user (header: `Authorization: Bearer <token>`)

Demo users: `team_leader`/`team123`, `call_center`/`call123`, `accounts`/`acc123`, `admin`/`admin123`

## Bosta API (`/api/bosta`)

- `POST` /api/bosta/search
- `GET` /api/bosta/order/{tracking_number}
- `GET` /api/bosta/customer/{phone_number}/orders
- `POST` /api/bosta/customer/{phone_number}/sync
- `GET` /api/bosta/health

## Customer API (`/api/customers`)

- `GET` /api/customers/
- `POST` /api/customers/
- `GET` /api/customers/search
- `GET` /api/customers/{customer_id}
- `PUT` /api/customers/{customer_id}

## Hub API (`/api/hub`)

- `GET` /api/hub/scan/{tracking_number}
- `POST` /api/hub/scan/receive
- `POST` /api/hub/scan/dispatch
- `GET` /api/hub/queues/workshop
- `GET` /api/hub/queues/pending-dispatch
- `POST` /api/hub/workshop/complete

## Service (Tickets) API (`/api/tickets`)

- `POST` /api/tickets/create
- `GET` /api/tickets/
- `POST` /api/tickets/{ticket_id}/confirm
- `POST` /api/tickets/{ticket_id}/cancel
- `GET` /api/tickets/{ticket_id}
- `GET` /api/tickets/{ticket_id}/history
- `GET` /api/tickets/{ticket_id}/actions
- `POST` /api/tickets/{ticket_id}/action

## Stock API (`/api/stock`)

- `GET` /api/stock/items
- `POST` /api/stock/items
- `GET` /api/stock/items/{item_id}
- `PUT` /api/stock/items/{item_id}
- `DELETE` /api/stock/items/{item_id}
- `POST` /api/stock/items/{item_id}/adjust
- `POST` /api/stock/items/{product_id}/components
- `DELETE` /api/stock/items/{product_id}/components/{component_id}
- `POST` /api/stock/manual
- `GET` /api/stock/movements
