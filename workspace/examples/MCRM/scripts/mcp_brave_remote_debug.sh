#!/usr/bin/env bash
# Start Brave (Nightly) with DevTools remote debugging on 127.0.0.1:9222.
# Required for chrome-devtools-mcp when using --browser-url (see .cursor/mcp.json).
# Close other Brave windows using this profile first, or change USER_DATA_DIR.
set -euo pipefail
BRAVE="${BRAVE:-/usr/bin/brave-origin-nightly}"
USER_DATA_DIR="${BRAVE_MCP_USER_DATA_DIR:-${TMPDIR:-/tmp}/brave-mcp-remote-profile}"
exec "$BRAVE" \
  --remote-debugging-port=9222 \
  --user-data-dir="$USER_DATA_DIR" \
  "$@"
