#!/usr/bin/env zsh
# Pack HUB-MCRM for deployment: copy to temp, strip dev cruft, zip, remove temp.
# Run from anywhere: ./pack-hub-mcrm.zsh
# Override output directory: OUT_BASE=/path/to/parent ./pack-hub-mcrm.zsh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BASE="${OUT_BASE:-$(dirname "$SCRIPT_DIR")}"
sourceDir="$(basename "$SCRIPT_DIR")"
tempDir="${BASE}/${sourceDir}-temp"

cd "$BASE" || exit 1

timestamp=$(date +"%Y-%m-%d-%H%M%S")
zipPath="${BASE}/${sourceDir}-project-${timestamp}.zip"

rm -rf "$tempDir"
cp -a "$sourceDir" "$tempDir"

find "$tempDir" -type d -name '__pycache__' -print0 2>/dev/null | xargs -0 rm -rf 2>/dev/null || true

rm -rf \
  "$tempDir/front/src" \
  "$tempDir/front/node_modules" \
  "$tempDir/front/public" \
  "$tempDir/front/package.json" \
  "$tempDir/front/package-lock.json" \
  "$tempDir/front/vite.config.js" \
  "$tempDir/front/tailwind.config.js" \
  "$tempDir/front/eslint.config.js" \
  "$tempDir/front/postcss.config.js" \
  "$tempDir/front/index.html" \
  "$tempDir/front/.env" \
  "$tempDir/front/.env.production" \
  "$tempDir/front/.htaccess" \
  "$tempDir/front/.gitignore" \
  "$tempDir/.pytest_cache" \
  "$tempDir/.venv" \
  "$tempDir/venv" \
  "$tempDir/.git" \
  2>/dev/null || true

( cd "$tempDir" && zip -r -q "$zipPath" . )

rm -rf "$tempDir"

echo "Zip file created: $zipPath"
ls -lh "$zipPath"
