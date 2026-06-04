# HUB-MCRM API MCP

MCP server that exposes **all** HUB-MCRM API endpoints through one adaptable tool and one resource.

## What it does

- **Resource `hub-mcrm://manifest`** — Full API manifest: every endpoint with `operation_id`, method, path, path_params, query_params, body schema, and response/error cases. The model (or you) can read this to know all args and cases.
- **Tool `hub_mcrm_api_call`** — Call any endpoint by `operation_id` + optional `path_params`, `query`, `body`. No per-endpoint tools to maintain.

When you add or change an endpoint, update `docs/system/api-manifest.json`; the MCP stays the same.

## Setup

1. From repo root (so `docs/system/api-manifest.json` is resolvable):

   ```bash
   cd mcp-servers/hub-mcrm-api
   npm install
   npm run build
   ```

2. Point Cursor (or any MCP client) at this server. Example config (repo root: `mcp_config.json` or `.cursor/mcp.json`):

   ```json
   {
     "mcpServers": {
       "hub-mcrm-api": {
         "command": "node",
         "args": ["/path/to/HUB-MCRM/mcp-servers/hub-mcrm-api/dist/index.js"],
         "env": {
           "HUB_MCRM_API_URL": "http://127.0.0.1:5050",
           "HUB_MCRM_MANIFEST_PATH": "/path/to/HUB-MCRM/docs/system/api-manifest.json"
         }
       }
     }
   }
   ```

   Replace `/path/to/HUB-MCRM` with your clone path (Windows: `F:/...` style works in JSON). Ensure the backend is reachable at `HUB_MCRM_API_URL`.

## Env

| Env | Default | Purpose |
|-----|--------|--------|
| `HUB_MCRM_API_URL` | `http://localhost:5050` | Base URL of the Flask API |
| `HUB_MCRM_MANIFEST_PATH` | `{cwd}/docs/system/api-manifest.json` | Path to the API manifest JSON |

## Usage (model / client)

1. Read resource `hub-mcrm://manifest` to get all operation ids and their params/cases.
2. Call tool `hub_mcrm_api_call` with `operation_id` and any `path_params`, `query`, `body` as in the manifest.

Example (pseudo): `hub_mcrm_api_call({ operation_id: "call_center_list_orders", query: { status: "new", page: 1 } })`.
