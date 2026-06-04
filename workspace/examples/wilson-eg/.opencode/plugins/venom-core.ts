// venom-core.ts — VENOM intelligence layer for OpenCode
//
// Targets @opencode-ai/plugin@1.3.3: tool() + Hooks
//
// Pattern #1: Context — experimental.chat.system.transform
// Pattern #2: Loop detection — tool.execute.before
// Pattern #3: Instincts — venom_instinct tool
// Pattern #4: Hooks — event + tool.execute.* + shell.env
// Pattern #5: Workflow — venom_workflow_update tool
// Pattern #7: Memory/compaction — experimental.session.compacting + session.idle
// Pattern #8: Safety — tool.execute.before blocking + permission.ask

import type { Plugin, Hooks } from "@opencode-ai/plugin";
import { tool } from "@opencode-ai/plugin";

const z = tool.schema;

import { readFile, writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";

// ─── Paths ───────────────────────────────────────────────────────

const VENOM_DIR = ".venom";
const CONTEXT_PATH = join(VENOM_DIR, "CONTEXT.md");
const MEMORY_PATH = join(VENOM_DIR, "memory", "MEMORY.md");
const INSTINCTS_PATH = join(VENOM_DIR, "learnings", "instincts.yaml");
const CORRECTIONS_PATH = join(VENOM_DIR, "learnings", "corrections.yaml");
const ACTIVE_PATH = join(VENOM_DIR, "work", "ACTIVE.md");
const METRICS_PATH = join(VENOM_DIR, "state", "session-metrics.json");
const WORKFLOW_STATE_PATH = join(VENOM_DIR, "state", "workflow-state.json");

// ─── Workflow State (Pattern #5) ─────────────────────────────────

interface WorkflowState {
  workflow: "spec" | "ship" | "debug" | "eat" | null;
  feature?: string;
  phase: number;
  phaseName: string;
  artifacts: string[];
  lastUpdated: string;
  sessionId: string;
  complete: boolean;
}

// ─── Resource Limits (Pattern #8) ────────────────────────────────

const LIMITS = {
  maxToolCalls: 200,
  maxCostUsd: 5.0,
  maxFileWrites: 50,
  warnCostUsd: 1.0,
  loopDetectionWindow: 5,
  loopRepeatThreshold: 3,
} as const;

// ─── Danger Patterns (Pattern #8) ────────────────────────────────

const DANGER_PATTERNS: Array<{ pattern: RegExp; severity: "deny" | "warn" }> = [
  { pattern: /rm\s+-rf\s+\/(?!tmp)/, severity: "deny" },
  { pattern: /sudo\s+/, severity: "warn" },
  { pattern: /curl\s+.*\|\s*(?:ba)?sh/, severity: "deny" },
  { pattern: />\s*\/dev\/sd[a-z]/, severity: "deny" },
  { pattern: /dd\s+.*of=\/dev/, severity: "deny" },
  { pattern: /:()\{\s*:\|:&\s*\};:/, severity: "deny" },
  { pattern: /chmod\s+777/, severity: "warn" },
  { pattern: /git\s+push\s+.*--force(?!\s+-with-lease)/, severity: "warn" },
  { pattern: /DROP\s+(?:TABLE|DATABASE)/i, severity: "warn" },
  { pattern: /TRUNCATE\s+/i, severity: "warn" },
];

const SENSITIVE_FILE_PATTERNS = [
  /\.env$/,
  /\.env\..+$/,
  /credentials?\.json$/,
  /\.key$/,
  /\.pem$/,
  /\.p12$/,
  /secret/i,
  /\.ssh\//,
];

// ─── State ───────────────────────────────────────────────────────

interface ToolCallRecord {
  tool: string;
  target: string;
  timestamp: number;
}

interface SessionMetrics {
  sessionId: string;
  startTime: string;
  toolCalls: number;
  fileWrites: number;
  costUsd: number;
  inputTokens: number;
  outputTokens: number;
  toolBreakdown: Record<string, number>;
  filesModified: string[];
  warningsSent: string[];
  recentCalls: ToolCallRecord[];
  loopWarnings: number;
  deniedCalls: string[];
}

let metrics: SessionMetrics = createFreshMetrics("pending");
const systemInjectedForSession = new Set<string>();
let systemInjectedWithoutSessionId = false;

function createFreshMetrics(sessionId: string): SessionMetrics {
  return {
    sessionId,
    startTime: new Date().toISOString(),
    toolCalls: 0,
    fileWrites: 0,
    costUsd: 0,
    inputTokens: 0,
    outputTokens: 0,
    toolBreakdown: {},
    filesModified: [],
    warningsSent: [],
    recentCalls: [],
    loopWarnings: 0,
    deniedCalls: [],
  };
}

// ─── Helpers ─────────────────────────────────────────────────────

async function safeRead(dir: string, path: string): Promise<string | null> {
  try {
    return await readFile(join(dir, path), "utf-8");
  } catch {
    return null;
  }
}

async function safeWrite(dir: string, path: string, content: string): Promise<boolean> {
  try {
    const full = join(dir, path);
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, content, "utf-8");
    return true;
  } catch {
    return false;
  }
}

async function appendToFile(dir: string, path: string, content: string): Promise<boolean> {
  const existing = (await safeRead(dir, path)) ?? "";
  return safeWrite(dir, path, existing + "\n" + content);
}

function extractPathFromArgs(args: unknown): string {
  if (args && typeof args === "object") {
    const a = args as Record<string, unknown>;
    // OpenCode often uses filePath; other hosts use path/file
    return String(
      a.filePath ?? a.path ?? a.file ?? a.targetPath ?? a.target ?? ""
    );
  }
  return "";
}

function extractCommandFromArgs(args: unknown): string {
  if (args && typeof args === "object") {
    const a = args as Record<string, unknown>;
    return String(a.command ?? a.cmd ?? a.script ?? "");
  }
  return "";
}

function blockBash(output: { args: unknown }, reason: string): void {
  if (output.args && typeof output.args === "object" && "command" in output.args) {
    const o = output.args as { command: string };
    o.command = `echo "[VENOM BLOCKED] ${reason.replace(/"/g, "'")}" >&2; exit 1`;
  }
}

/**
 * Non-bash tools: never wipe/replace args — that breaks Zod schemas (write/edit/patch)
 * and causes infinite invalid-tool retries (see session-ses_2cac).
 * Bash-only: replace `command` with exit 1 (host still runs a command).
 */
function warnOrBashBlock(output: { args: unknown }, toolName: string, reason: string): void {
  const t = toolName.toLowerCase();
  if (t.includes("bash") || t === "shell") {
    blockBash(output, reason);
  } else {
    metrics.warningsSent.push(`[VENOM would block] ${toolName}: ${reason}`);
  }
}

function detectStall(record: ToolCallRecord): string | null {
  const window = metrics.recentCalls.slice(-LIMITS.loopDetectionWindow);
  const identical = window.filter(
    (r) => r.tool === record.tool && r.target === record.target
  );
  if (identical.length >= LIMITS.loopRepeatThreshold) {
    return `Loop detected: "${record.tool}" on "${record.target}" repeated ${identical.length}x. Change strategy.`;
  }
  return null;
}

function recordCall(record: ToolCallRecord): void {
  metrics.recentCalls.push(record);
  if (metrics.recentCalls.length > LIMITS.loopDetectionWindow * 2) {
    metrics.recentCalls = metrics.recentCalls.slice(-LIMITS.loopDetectionWindow);
  }
}

function looksLikeFileWriteTool(toolName: string): boolean {
  const t = toolName.toLowerCase();
  return (
    t.includes("write") ||
    t.includes("edit") ||
    t === "patch" ||
    t.includes("apply_patch") ||
    t.includes("strreplace")
  );
}

// ─── VENOM Context (Pattern #1) ──────────────────────────────────

async function buildVenomContext(dir: string): Promise<string> {
  const parts: string[] = [];

  const context = await safeRead(dir, CONTEXT_PATH);
  if (context) {
    parts.push("## VENOM Project Context\n" + context.trim());
  }

  const corrections = await safeRead(dir, CORRECTIONS_PATH);
  if (corrections?.trim()) {
    parts.push("## Never-Again Rules\n" + corrections.trim());
  }

  const active = await safeRead(dir, ACTIVE_PATH);
  if (active?.trim() && !active.includes("No active work tracked")) {
    parts.push("## Where We Left Off\n" + active.trim());
  }

  try {
    const wfRaw = await safeRead(dir, WORKFLOW_STATE_PATH);
    if (wfRaw) {
      const wf: WorkflowState = JSON.parse(wfRaw);
      if (wf.workflow && !wf.complete) {
        const featureNote = wf.feature ? ` — feature: ${wf.feature}` : "";
        parts.push(
          `## Active Workflow\n` +
          `Workflow: ${wf.workflow}${featureNote}\n` +
          `Phase: ${wf.phase} — ${wf.phaseName}\n` +
          `Artifacts: ${wf.artifacts.length > 0 ? wf.artifacts.join(", ") : "none yet"}`
        );
      }
    }
  } catch {}

  if (parts.length === 0) {
    return "VENOM is active. No project context yet — run /venom-init.";
  }

  return parts.join("\n\n---\n\n");
}

async function generateVenomSnapshot(dir: string): Promise<string> {
  const context = await safeRead(dir, CONTEXT_PATH);
  const corrections = await safeRead(dir, CORRECTIONS_PATH);
  const active = await safeRead(dir, ACTIVE_PATH);

  const lines: string[] = ["## VENOM State — persist through compaction"];

  if (context) {
    lines.push(`**Project:** ${context.split("\n")[0].replace(/^#\s*/, "")}`);
  }

  if (active?.trim() && !active.includes("No active work tracked")) {
    lines.push(`**Active task:**\n${active.trim().split("\n").slice(0, 5).join("\n")}`);
  }

  if (metrics.filesModified.length > 0) {
    lines.push(`**Files modified:** ${metrics.filesModified.slice(-10).join(", ")}`);
  }

  if (corrections?.trim()) {
    lines.push(`**Never-again rules:**\n${corrections.trim()}`);
  }

  lines.push(
    `**Session:** $${metrics.costUsd.toFixed(3)} | ${metrics.toolCalls}/${LIMITS.maxToolCalls} calls | ${metrics.fileWrites} writes`
  );

  if (metrics.loopWarnings > 0) {
    lines.push(`**Loop warnings:** ${metrics.loopWarnings}`);
  }

  if (metrics.deniedCalls.length > 0) {
    lines.push(`**Blocked:** ${metrics.deniedCalls.length}`);
  }

  return lines.join("\n");
}

// ─── Plugin ───────────────────────────────────────────────────────

const venomPlugin: Plugin = async (ctx) => {
  const dir = ctx.directory;

  // ── Tools ───────────────────────────────────────────────────────

  const venomRemember = tool({
    description: "Save a decision, pattern, or learning to VENOM's persistent memory. Use for architecture decisions, bug root causes, user corrections.",
    args: {
      content: z.string().describe("What to remember — be specific and concise"),
      type: z.enum(["decision", "pattern", "correction", "note"]).describe("Type of memory entry"),
    },
    async execute(input) {
      const timestamp = new Date().toISOString().split("T")[0];
      const entry = `\n## ${input.type} — ${timestamp}\n${input.content}\n`;
      const success = await appendToFile(dir, MEMORY_PATH, entry);
      return success
        ? `✓ Remembered: ${input.type} saved to MEMORY.md`
        : "✗ Failed — run /venom-init first.";
    },
  });

  const venomInstinct = tool({
    description: "Capture a learned pattern as an instinct. Instincts fire before tool execution to prevent repeated mistakes.",
    args: {
      trigger: z.string().describe("When this should fire (e.g. 'About to create a TODO comment')"),
      action: z.string().describe("What to do instead"),
      confidence: z.number().min(0).max(1).describe("0.3 = first observation | 0.6 = seen 3x | 0.9 = proven"),
      evidence: z.string().describe("What happened that taught this"),
    },
    async execute(input) {
      const timestamp = new Date().toISOString().split("T")[0];
      const id = `instinct-${Date.now()}`;
      const entry = [
        `\n- id: ${id}`,
        `  confidence: ${input.confidence}`,
        `  trigger: "${input.trigger}"`,
        `  action: "${input.action}"`,
        `  evidence: "${input.evidence}"`,
        `  learned: "${timestamp}"`,
        `  fire_count: 0`,
      ].join("\n");

      const success = await appendToFile(dir, INSTINCTS_PATH, entry);
      return success
        ? `✓ Instinct: "${input.trigger}" → "${input.action}" (${input.confidence})`
        : "✗ Failed — run /venom-init first.";
    },
  });

  const venomWorkflowUpdate = tool({
    description: "Update VENOM's workflow state — which workflow is active, what phase. Call at start/end of each workflow phase.",
    args: {
      workflow: z.enum(["spec", "ship", "debug", "eat"]).describe("Active workflow"),
      feature: z.string().optional().describe("Feature slug for spec workflow"),
      phase: z.number().describe("Current phase number (0-indexed)"),
      phaseName: z.string().describe("Human-readable phase name"),
      artifactWritten: z.string().optional().describe("Path of artifact just written"),
      complete: z.boolean().optional().describe("Set true when workflow is done"),
    },
    async execute(input) {
      let existing: WorkflowState | null = null;
      try {
        const raw = await safeRead(dir, WORKFLOW_STATE_PATH);
        if (raw) existing = JSON.parse(raw);
      } catch {}

      const artifacts = existing?.artifacts ?? [];
      if (input.artifactWritten && !artifacts.includes(input.artifactWritten)) {
        artifacts.push(input.artifactWritten);
      }

      const state: WorkflowState = {
        workflow: input.workflow,
        feature: input.feature ?? existing?.feature,
        phase: input.phase,
        phaseName: input.phaseName,
        artifacts,
        lastUpdated: new Date().toISOString(),
        sessionId: metrics.sessionId,
        complete: input.complete ?? false,
      };

      const success = await safeWrite(dir, WORKFLOW_STATE_PATH, JSON.stringify(state, null, 2));
      if (success) {
        const featureNote = state.feature ? ` (${state.feature})` : "";
        const doneNote = state.complete ? " — COMPLETE" : "";
        return `✓ Workflow: ${state.workflow}${featureNote} → Phase ${state.phase}: ${state.phaseName}${doneNote}`;
      }
      return "✗ Failed — run /venom-init first.";
    },
  });

  const venomStatus = tool({
    description: "Get current VENOM session status — metrics, limits, warnings.",
    args: {
      _dummy: z.string().optional(),
    },
    async execute() {
      const pctCalls = Math.round((metrics.toolCalls / LIMITS.maxToolCalls) * 100);
      const pctCost = Math.round((metrics.costUsd / LIMITS.maxCostUsd) * 100);
      const pctWrites = Math.round((metrics.fileWrites / LIMITS.maxFileWrites) * 100);

      return [
        `## VENOM Session Status`,
        ``,
        `**Session:** ${metrics.sessionId}`,
        `**Started:** ${metrics.startTime}`,
        ``,
        `| Metric | Used | Limit | % |`,
        `|--------|------|-------|---|`,
        `| Tool calls | ${metrics.toolCalls} | ${LIMITS.maxToolCalls} | ${pctCalls}% |`,
        `| Cost | $${metrics.costUsd.toFixed(3)} | $${LIMITS.maxCostUsd} | ${pctCost}% |`,
        `| File writes | ${metrics.fileWrites} | ${LIMITS.maxFileWrites} | ${pctWrites}% |`,
        ``,
        `**Files modified:** ${metrics.filesModified.length}`,
        `**Loop warnings:** ${metrics.loopWarnings}`,
        `**Blocked:** ${metrics.deniedCalls.length}`,
      ].join("\n");
    },
  });

  // ── Hooks ───────────────────────────────────────────────────────

  const hooks: Hooks = {
    tool: {
      venom_remember: venomRemember,
      venom_instinct: venomInstinct,
      venom_workflow_update: venomWorkflowUpdate,
      venom_status: venomStatus,
    },

    event: async ({ event }) => {
      switch (event.type) {
        case "session.created": {
          const sid = (event.properties as { info?: { id?: string } }).info?.id ?? "unknown";
          metrics = createFreshMetrics(sid);
          systemInjectedForSession.clear();
          systemInjectedWithoutSessionId = false;
          break;
        }
        case "session.idle": {
          await safeWrite(dir, METRICS_PATH, JSON.stringify(metrics, null, 2));

          if (metrics.filesModified.length > 0) {
            const today = new Date().toISOString().split("T")[0];
            const content = [
              `# Active Work — ${today}`,
              ``,
              `**Session:** ${metrics.sessionId}`,
              `**Modified:** ${metrics.filesModified.join(", ")}`,
              `**Cost:** $${metrics.costUsd.toFixed(3)} | **Calls:** ${metrics.toolCalls}`,
              ``,
              "Resume from here next session.",
            ].join("\n");
            await safeWrite(dir, ACTIVE_PATH, content);
          }
          break;
        }
        case "file.edited": {
          const filePath = String((event.properties as { file?: string }).file ?? "");
          if (filePath && !metrics.filesModified.includes(filePath)) {
            metrics.filesModified.push(filePath);
          }
          break;
        }
      }
    },

    "experimental.chat.system.transform": async (input, output) => {
      const sid = input.sessionID;
      if (sid) {
        if (systemInjectedForSession.has(sid)) return;
        systemInjectedForSession.add(sid);
      } else if (systemInjectedWithoutSessionId) {
        return;
      } else {
        systemInjectedWithoutSessionId = true;
      }
      const venomContext = await buildVenomContext(dir);
      output.system.push(venomContext);
    },

    "tool.execute.before": async (input, output) => {
      metrics.toolCalls++;
      const toolName = input.tool ?? "";
      metrics.toolBreakdown[toolName] = (metrics.toolBreakdown[toolName] ?? 0) + 1;

      // Hard limit: tool calls
      if (metrics.toolCalls > LIMITS.maxToolCalls) {
        metrics.deniedCalls.push(`${toolName}:limit`);
        warnOrBashBlock(output, toolName, `tool call limit (${LIMITS.maxToolCalls}) reached`);
        return;
      }

      // Hard limit: cost
      if (metrics.costUsd > LIMITS.maxCostUsd) {
        metrics.deniedCalls.push(`${toolName}:cost`);
        warnOrBashBlock(output, toolName, `cost limit ($${LIMITS.maxCostUsd}) reached`);
        return;
      }

      // File write tools
      if (looksLikeFileWriteTool(toolName)) {
        metrics.fileWrites++;
        const filePath = extractPathFromArgs(output.args);

        if (filePath) {
          if (!metrics.filesModified.includes(filePath)) {
            metrics.filesModified.push(filePath);
          }

          for (const pattern of SENSITIVE_FILE_PATTERNS) {
            if (pattern.test(filePath)) {
              metrics.deniedCalls.push(`file:${filePath}:sensitive`);
              warnOrBashBlock(output, toolName, `sensitive file "${filePath}"`);
              return;
            }
          }
        }

        if (metrics.fileWrites > LIMITS.maxFileWrites) {
          metrics.deniedCalls.push(`${toolName}:writelimit`);
          warnOrBashBlock(output, toolName, `file write limit (${LIMITS.maxFileWrites}) reached`);
          return;
        }

        // Loop detection — only when path is known. Empty path would make every write
        // share target "" and false-trigger stall after N calls (session-ses_2cac).
        if (filePath) {
          const record: ToolCallRecord = { tool: toolName, target: filePath, timestamp: Date.now() };
          const stall = detectStall(record);
          recordCall(record);
          if (stall) {
            metrics.loopWarnings++;
            warnOrBashBlock(output, toolName, stall);
            return;
          }
        }
      }

      // Bash/shell commands
      const t = toolName.toLowerCase();
      if (t.includes("bash") || t === "shell") {
        const command = extractCommandFromArgs(output.args);

        for (const { pattern, severity } of DANGER_PATTERNS) {
          if (pattern.test(command)) {
            if (severity === "deny") {
              metrics.deniedCalls.push(`bash:${command.substring(0, 30)}:danger`);
              blockBash(output, `dangerous pattern (${pattern.source})`);
              return;
            }
            metrics.warningsSent.push(`Danger zone: "${command.substring(0, 60)}"`);
          }
        }

        // Loop detection for bash
        const record: ToolCallRecord = {
          tool: toolName,
          target: command.substring(0, 120),
          timestamp: Date.now(),
        };
        const stall = detectStall(record);
        recordCall(record);
        if (stall) {
          metrics.loopWarnings++;
          metrics.warningsSent.push(stall);
        }
      }
    },

    "tool.execute.after": async (_input, output) => {
      const meta = output.metadata as Record<string, unknown> | undefined;
      const usage = meta?.usage as Record<string, unknown> | undefined;

      const inputTokens = Number(
        meta?.inputTokens ?? meta?.input_tokens ?? usage?.inputTokens ?? 0
      );
      const outputTokens = Number(
        meta?.outputTokens ?? meta?.output_tokens ?? usage?.outputTokens ?? 0
      );

      if (Number.isFinite(inputTokens)) metrics.inputTokens += inputTokens;
      if (Number.isFinite(outputTokens)) metrics.outputTokens += outputTokens;

      // Heuristic USD (placeholder rates; replace with GLM/Z.AI pricing if you need accuracy)
      metrics.costUsd += inputTokens * (3 / 1_000_000) + outputTokens * (15 / 1_000_000);

      // Cost warning toast
      if (metrics.costUsd > LIMITS.warnCostUsd && !metrics.warningsSent.includes("cost_warn_1")) {
        metrics.warningsSent.push("cost_warn_1");
        try {
          const client = ctx.client as {
            tui?: { toast?: { show?: (x: { body: { message: string; level: string } }) => void } };
          };
          client.tui?.toast?.show?.({
            body: {
              message: `VENOM: session cost $${metrics.costUsd.toFixed(2)} (limit $${LIMITS.maxCostUsd})`,
              level: "warning",
            },
          });
        } catch {}
      }

      // Attach VENOM metadata
      output.metadata = {
        ...output.metadata,
        venom: {
          sessionCost: `$${metrics.costUsd.toFixed(3)}`,
          toolCalls: metrics.toolCalls,
          fileWrites: metrics.fileWrites,
        },
      };
    },

    "experimental.session.compacting": async (_input, output) => {
      output.context ??= [];
      const snapshot = await generateVenomSnapshot(dir);
      output.context.push(snapshot);
      await safeWrite(dir, METRICS_PATH, JSON.stringify(metrics, null, 2));
    },

    "shell.env": async (_input, output) => {
      output.env = {
        ...output.env,
        VENOM_ACTIVE: "1",
        VENOM_PROJECT: dir,
        VENOM_SESSION: metrics.sessionId,
        VENOM_COST: metrics.costUsd.toFixed(3),
      };
    },

    "permission.ask": async (input, permOut) => {
      const cmd = String(input.metadata?.command ?? input.metadata?.bash ?? "");
      if (!cmd) return;

      for (const { pattern, severity } of DANGER_PATTERNS) {
        if (pattern.test(cmd) && severity === "deny") {
          permOut.status = "deny";
          metrics.deniedCalls.push(`permission:${cmd.substring(0, 30)}`);
          return;
        }
      }
    },
  };

  return hooks;
};

export default venomPlugin;
