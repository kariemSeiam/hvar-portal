# Frontend structure

## Convention

- **Route-level components** live in `front/src/pages/`. Each file in `pages/` corresponds to a route (e.g. `ServiceActionsPage.jsx` for `/services`).
- **Reusable UI and feature compositions** live in `front/src/components/`. Use `components/` for shared primitives (Button, Modal, PageHeader) and feature-specific UI (modals, filters, tables).

## Imports

- **Barrel** (`from '../components'`): Use for shared primitives only — Button, Input, PageHeader, EmptyState, Modal, etc.
- **Direct**: Use for feature-heavy or route-specific components so lazy route chunks do not pull the entire components barrel:
  - Modals: `from '../components/modals/UnifiedServiceActionModal'`, `from '../components/modals/ServiceModalViewer'`, etc.
  - Service: `from '../components/service/ServiceActionsFilters'`, `from '../components/service/ServiceActionsPage'`, etc.
- In pages and in ServiceActionsPage, prefer direct imports for modals and service-specific components.
