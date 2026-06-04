#!/usr/bin/env node
/**
 * Minimal MCP stdio client: initialize → initialized → tools/list → resources/read (manifest)
 * + tools/call with bogus operation_id (no HTTP server required).
 */
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const manifestPath = join(__dirname, "..", "..", "docs", "system", "api-manifest.json");
const entry = join(__dirname, "dist", "index.js");

const child = spawn(process.execPath, [entry], {
  cwd: __dirname,
  env: {
    ...process.env,
    HUB_MCRM_MANIFEST_PATH: manifestPath,
    HUB_MCRM_API_URL: "http://127.0.0.1:9",
  },
  stdio: ["pipe", "pipe", "pipe"],
});

let stderrBuf = "";
child.stderr.on("data", (c) => {
  stderrBuf += c.toString();
});

const rl = createInterface({ input: child.stdout });
const pendingLines = [];
let lineResolvers = [];
rl.on("line", (line) => {
  const next = lineResolvers.shift();
  if (next) next(line);
  else pendingLines.push(line);
});

function readLine(timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    if (pendingLines.length > 0) {
      resolve(pendingLines.shift());
      return;
    }
    const t = setTimeout(() => reject(new Error(`timeout waiting for MCP line (${timeoutMs}ms)`)), timeoutMs);
    lineResolvers.push((line) => {
      clearTimeout(t);
      resolve(line);
    });
  });
}

async function readUntilId(expectedId) {
  while (true) {
    const line = await readLine();
    const msg = JSON.parse(line);
    if (msg.id === expectedId) return msg;
  }
}

function send(obj) {
  child.stdin.write(JSON.stringify(obj) + "\n");
}

let reqId = 0;

async function request(method, params) {
  const id = ++reqId;
  send({ jsonrpc: "2.0", id, method, params });
  return readUntilId(id);
}

function fail(msg) {
  console.error(msg);
  if (stderrBuf) console.error("server stderr:", stderrBuf);
  child.kill("SIGTERM");
  process.exit(1);
}

try {
  const init = await request("initialize", {
    protocolVersion: "2025-11-25",
    capabilities: {},
    clientInfo: { name: "hub-mcrm-api-smoke", version: "1.0.0" },
  });
  if (init.error) fail("initialize error: " + JSON.stringify(init.error));
  if (!init.result?.serverInfo?.name) fail("initialize: missing serverInfo " + JSON.stringify(init.result));

  send({ jsonrpc: "2.0", method: "notifications/initialized" });

  const tools = await request("tools/list", {});
  if (tools.error) fail("tools/list error: " + JSON.stringify(tools.error));
  const names = tools.result?.tools?.map((t) => t.name) ?? [];
  if (!names.includes("hub_mcrm_api_call")) fail("tools/list: expected hub_mcrm_api_call, got " + JSON.stringify(names));

  const resList = await request("resources/list", {});
  if (resList.error) fail("resources/list error: " + JSON.stringify(resList.error));
  const uris = resList.result?.resources?.map((r) => r.uri) ?? [];
  if (!uris.some((u) => String(u).includes("manifest"))) fail("resources/list: expected manifest uri, got " + JSON.stringify(uris));

  const readRes = await request("resources/read", { uri: "hub-mcrm://manifest" });
  if (readRes.error) fail("resources/read error: " + JSON.stringify(readRes.error));
  const text = readRes.result?.contents?.[0]?.text;
  if (!text || !text.includes("operations")) fail("resources/read: expected manifest JSON with operations");

  const badOp = await request("tools/call", {
    name: "hub_mcrm_api_call",
    arguments: { operation_id: "__definitely_not_an_operation__" },
  });
  if (badOp.error) fail("tools/call error: " + JSON.stringify(badOp.error));
  const body = badOp.result?.content?.[0]?.text;
  if (!body || !body.includes("UNKNOWN_OPERATION")) fail("tools/call: expected UNKNOWN_OPERATION in body, got " + String(body).slice(0, 200));

  console.log("smoke OK: initialize, tools/list, resources/list, resources/read, tools/call (unknown op)");
} catch (e) {
  fail(String(e?.message || e));
} finally {
  child.stdin.end();
  child.kill("SIGTERM");
}
