#!/usr/bin/env bash
# ── publish: studio/site  →  the 0xr-site repo ───────────────────────────
# studio is the workspace. 0xr-site is the published artefact. This copies
# the site across, reports what moved, and stops. It never commits: the
# branch, the message and the push stay a human decision.
#
#   ./scripts/publish.sh          show what would change, touch nothing
#   ./scripts/publish.sh --write  copy the changed files across
set -euo pipefail

SRC="$(cd "$(dirname "$0")/.." && pwd)"
HERE="$(cd "$(dirname "$0")" && pwd)"
DEST="${OXR_SITE_REPO:-$HOME/Desktop/My_Agents/0xr-site-old}"
WRITE="${1:-}"

[ -d "$DEST/.git" ] || { echo "no repo at $DEST — set OXR_SITE_REPO"; exit 1; }

# Two kinds of exclusion, and the difference matters because --delete is on:
#   cv/ never ships. It carries a phone number and the repo is public.
#   The rest are owned by the repo, not by studio. Without these they would
#   be deleted on every publish, because they do not exist in studio/site.
EXCLUDE=(
  --exclude ".DS_Store" --exclude ".git/"
  --exclude "cv/"
  --exclude "README.md" --exclude "package.json"
  --exclude ".gitignore" --exclude "scripts/"
  # the crew's workshop: depth maps, the model compiler, the source figures,
  # the generation prompts and every contact sheet. The site needs crew3d.js
  # and the six <name>.model.js files at runtime and nothing else here.
  --exclude "crew/gen/" --exclude "crew/*.txt" --exclude "crew/*.vox" --exclude "crew/*.py"
  --exclude "crew/*.html" --exclude "crew/*.png" --exclude "crew/look.md"
  # working notes have no business on the public site: the pages are html
  --exclude "*.md"
  # Finder and iCloud leave "name 2.ext" copies all over this tree; four of
  # them reached the public repo before this line existed.
  --exclude "* 2.*"
)

# --checksum, not timestamps: a copied file always has a fresh mtime, so
# without this every file reads as changed on every run.
RSYNC=(rsync -a --checksum --delete "${EXCLUDE[@]}")

echo "  from  $SRC"
echo "  to    $DEST"
echo

# rsync's itemised flags: a leading "." means no update is needed and only
# metadata differs, which is every file after a copy. Only ">" (transfer),
# "c" (create) and "*" (delete) are real changes.
CHANGED=$("${RSYNC[@]}" -in "$SRC/" "$DEST/" | grep -E '^[>c*]' | grep -v '/$' || true)

if [ -z "$CHANGED" ]; then
  echo "  nothing to publish, the artefact is current"
  exit 0
fi

echo "$CHANGED" | sed 's/^/  /'
echo "  $(echo "$CHANGED" | wc -l | tr -d ' ') file(s)"
echo

if [ "$WRITE" != "--write" ]; then
  echo "  dry run. re-run with --write to copy."
  exit 0
fi

"${RSYNC[@]}" "$SRC/" "$DEST/" >/dev/null
# the build script lives in studio; media/ sits at the repo root once
# published, so its one path is rewritten on the way over
sed 's|const DIR = "site/media";|const DIR = "media";|' \
  "$HERE/posts.mjs" > "$DEST/scripts/posts.mjs"
find "$DEST" -name ".DS_Store" -delete

echo "  copied. next, in $DEST:"
echo "    git checkout main && git pull"
echo "    git checkout -b fix/what-you-changed"
echo "    git add -A && git commit -m \"fix(area): what you did\""
echo "    git push -u origin HEAD && gh pr create --base main --fill"
echo
echo "  no reviewer: the remote owner is 0xRcap."
