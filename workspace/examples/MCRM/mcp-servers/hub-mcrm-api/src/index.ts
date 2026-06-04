#!/usr/bin/env node
/**
 * HUB-MCRM API MCP server.
 * - Resource: hub-mcrm://manifest — full API manifest (all endpoints, args, cases).
 * - Tool: hub_mcrm_api_call(operation_id, path_params?, query?, body?) — call any endpoint.
 *
 * Env: HUB_MCRM_API_URL (default http://localhost:5050), HUB_MCRM_MANIFEST_PATH (optional).
 */

import { readFileSync } from "node:fs";
import { createInterface } from "node:readline";
import { resolve } from "node:path";
import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const DEFAULT_BASE = "http://localhost:5050";
const DEFAULT_MANIFEST_REL = "docs/system/api-manifest.json";

type Manifest = {
  version?: string;
  base_url_env?: string;
  default_base?: string;
  operations?: Array<{
    id: string;
    method: string;
    path: string;
    path_params?: Array<{ name: string; type: string }>;
    query_params?: Array<{ name: string; type: string; optional?: boolean }>;
    body?: Record<string, unknown> | null;
    description?: string;
    responses?: Record<string, string>;
    errors?: string[];
  }>;
};

function loadManifest(): Manifest {
  const path =
    process.env.HUB_MCRM_MANIFEST_PATH ||
    resolve(process.cwd(), DEFAULT_MANIFEST_REL);
  const raw = readFileSync(path, "utf-8");
  return JSON.parse(raw) as Manifest;
}

function buildPath(template: string, pathParams: Record<string, string | number>): string {
  let out = template;
  for (const [key, value] of Object.entries(pathParams)) {
    out = out.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
  }
  return out;
}

function buildUrl(base: string, path: string, query?: Record<string, string | number | string[]>) {
  const url = new URL(path, base);
  if (query && Object.keys(query).length > 0) {
    for (const [k, v] of Object.entries(query)) {
      if (Array.isArray(v)) {
        v.forEach((vv) => url.searchParams.append(k, String(vv)));
      } else {
        url.searchParams.set(k, String(v));
      }
    }
  }
  return url.toString();
}

async function main() {
  const manifest = loadManifest();
  const baseUrl = process.env.HUB_MCRM_API_URL || manifest.default_base || DEFAULT_BASE;

  const server = new McpServer({
    name: "hub-mcrm-api",
    version: "1.0.0",
  });

  // Resource: full manifest so the model can see all operations, args, and cases
  server.registerResource(
    "api-manifest",
    "hub-mcrm://manifest",
    {
      title: "HUB-MCRM API manifest",
      description: "All endpoints with path/query/body params and response/error cases",
      mimeType: "application/json",
    },
    async () => ({
      contents: [
        {
          uri: "hub-mcrm://manifest",
          mimeType: "application/json",
          text: JSON.stringify(manifest, null, 2),
        },
      ],
    })
  );

  // Tool: call any operation by id
  server.registerTool(
    "hub_mcrm_api_call",
    {
      title: "Call HUB-MCRM API",
      description:
        "Call any HUB-MCRM API endpoint by operation_id. Use resource hub-mcrm://manifest to see all operation ids, methods, path/query/body params and error cases.",
      inputSchema: {
        operation_id: z.string().describe("Operation id from the API manifest (e.g. call_center_list_orders, tickets_get)"),
        path_params: z
          .record(z.union([z.string(), z.number()]))
          .optional()
          .describe("Path parameters, e.g. { order_id: 42 } or { ticket_id: 1 }"),
        query: z
          .record(z.union([z.string(), z.number(), z.array(z.string())]))
          .optional()
          .describe("Query string parameters"),
        body: z.record(z.unknown()).optional().describe("JSON body for POST/PUT"),
      },
    },
    async ({ operation_id, path_params, query, body }) => {
      const op = manifest.operations?.find((o) => o.id === operation_id);
      if (!op) {
        const ids = manifest.operations?.map((o) => o.id).slice(0, 20).join(", ") ?? "none";
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({
                error: "UNKNOWN_OPERATION",
                message: `Unknown operation_id: ${operation_id}. Known ids (sample): ${ids}...`,
              }),
            },
          ],
        };
      }

      const pathParams = path_params ?? {};
      const path = buildPath(op.path, pathParams);
      let finalQuery = (query ?? {}) as Record<string, string | number | string[]>;
      if (operation_id === "erp_get_drafts") {
        if (!finalQuery.username && process.env.ERP_DEFAULT_USERNAME) finalQuery = { ...finalQuery, username: process.env.ERP_DEFAULT_USERNAME };
        if (!finalQuery.password && process.env.ERP_DEFAULT_PASSWORD) finalQuery = { ...finalQuery, password: process.env.ERP_DEFAULT_PASSWORD };
      }
      const url = buildUrl(baseUrl, path, Object.keys(finalQuery).length > 0 ? finalQuery : undefined);

      const method = (op.method || "GET").toUpperCase();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      const init: RequestInit = { method, headers };
      if ((method === "POST" || method === "PUT" || method === "PATCH") && body != null && Object.keys(body).length > 0) {
        init.body = JSON.stringify(body);
      }

      try {
        const res = await fetch(url, init);
        const text = await res.text();
        let parsed: unknown;
        try {
          parsed = JSON.parse(text);
        } catch {
          parsed = text;
        }
        const payload = {
          status: res.status,
          statusText: res.statusText,
          data: parsed,
        };
        return {
          content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }],
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify({ error: "FETCH_ERROR", message, url }),
            },
          ],
        };
      }
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  const out = createInterface({ input: process.stdin, output: process.stderr });
  out.write(`HUB-MCRM API MCP failed: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
