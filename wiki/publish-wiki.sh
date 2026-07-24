#!/usr/bin/env bash
# Publishes the contents of wiki/ to the GitHub wiki of this repository.
#
# One-time prerequisite (GitHub limitation): the wiki git repo only exists
# after the FIRST page is created via the web UI. Do this once:
#   1. Open https://github.com/zazieproductions/void-oculus/wiki
#   2. Click "Create the first page" and save it with any content
# Then run:  ./wiki/publish-wiki.sh
#
# Requires: git with push access to the repository (HTTPS or SSH).

set -euo pipefail

REPO_SLUG="${1:-zazieproductions/void-oculus}"
WIKI_URL="https://github.com/${REPO_SLUG}.wiki.git"
SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "${TMP_DIR}"' EXIT

echo "→ Cloning ${WIKI_URL}"
if ! git clone --depth 1 "${WIKI_URL}" "${TMP_DIR}/wiki" 2>/dev/null; then
  echo "✗ Wiki repo not found. Create the first page in the web UI once:"
  echo "  https://github.com/${REPO_SLUG}/wiki"
  exit 1
fi

echo "→ Syncing pages"
find "${TMP_DIR}/wiki" -maxdepth 1 -name '*.md' -delete
cp "${SRC_DIR}"/*.md "${TMP_DIR}/wiki/"

cd "${TMP_DIR}/wiki"
git add -A
if git diff --cached --quiet; then
  echo "✓ Wiki already up to date."
  exit 0
fi
git commit -m "Sync wiki from repository wiki/ directory"
git push
echo "✓ Published to https://github.com/${REPO_SLUG}/wiki"
