# Pages (route-level)

Route-level components. Lazy-loaded from `App.jsx`.

---

## Routes

| Path | Component | Source |
|------|-----------|--------|
| `/` | HubPage | pages/HubPage.jsx |
| `/services` | ServiceActionsPage | components/service/ServiceActionsPage.jsx |
| `/stock` | StockManagementPage | pages/StockManagementPage.jsx |
| `/customer-service` | CustomerServicePage | pages/CustomerServicePage.jsx |
| `/demo` | DemoLandingPage | pages/DemoLandingPage.jsx |
| `/demo/new-tickets` | NewTicketsDemoPage | pages/NewTicketsDemoPage.jsx |
| `*` | NotFoundPage | pages/NotFoundPage.jsx |

---

## Note

ServiceActionsPage lives in `components/service/` (large, with subcomponents/hooks). App.jsx imports it directly; no wrapper in pages/.
