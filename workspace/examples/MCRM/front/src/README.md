# Source layout

Entry: `App.jsx` (routes, lazy load). Design: [docs/design/design.md](../../docs/design/design.md) · [docs/system/frontend-structure.md](../../docs/system/frontend-structure.md).

---


| Path          | Role                                                                           |
| ------------- | ------------------------------------------------------------------------------ |
| `pages/`      | Route-level: HubPage, StockManagementPage, CustomerServicePage, Demo, NotFound |
| `components/` | call-center, hub, modals, service, stock, ui, layout, filters, forms           |
| `api/`        | callCenterAPI, ticketsAPI, serviceActionAPI, axios                             |
| `contexts/`   | AuthProvider, Theme, CallSessionContext                                        |
| `utils/`      | stockUtils, dateUtils, rtl, designTokens, permissions, etc.                    |
| `styles/`     | design-tokens.css (source of truth), scrollbar, index.css                      |
| `config/`     | environment.js                                                                 |
| `hooks/`      | Custom hooks                                                                   |


`/services` loads from `components/service/ServiceActionsPage.jsx` (lazy). Other routes from `pages/`.