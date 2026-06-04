#!/bin/bash
# setup.sh — Install VENOM plugin dependencies
# Run once after copying the template to a new project

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGINS_DIR="$SCRIPT_DIR"

echo "VENOM Plugin Setup"
echo "=================="

# Check if npm exists
if ! command -v npm &> /dev/null; then
    echo "✗ npm not found. Install Node.js first."
    exit 1
fi

# Install dependencies
echo "Installing plugin dependencies..."
cd "$PLUGINS_DIR"
npm install --silent

# Type check
echo "Verifying TypeScript..."
if [ -d "node_modules/.bin" ]; then
    ./node_modules/.bin/tsc --noEmit 2>&1 && echo "✓ TypeScript OK" || {
        echo "✗ TypeScript errors found"
        exit 1
    }
fi

echo ""
echo "✓ VENOM plugin ready"
echo ""
echo "Add to your opencode.json:"
echo '  "plugin": [".opencode/plugins/venom-core.ts"]'
