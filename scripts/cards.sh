#!/usr/bin/env bash
# ── cards: render one share card per page ────────────────────────────────
# A link posted to X shows whatever og:image says. One generic card for four
# pages wastes the deep link, so each page gets its own headline rendered in
# the real display face at 2x.
#
#   ./scripts/cards.sh        write site/media/card-*.jpg
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
SITE="$HERE/.."
OUT="$SITE/media"
TMP="$(mktemp -d)"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
trap 'rm -rf "$TMP"' EXIT

[ -x "$CHROME" ] || { echo "Chrome not found at $CHROME"; exit 1; }
cp "$SITE/fonts/oliveira.otf" "$SITE/media/mark-0xr.svg" "$TMP/"

# slug | line 1, the offer | line 2, the position
# One card serves every page: they carried identical copy as four identical
# files. An empty slug writes media/card.jpg. Add rows back if a page ever
# earns its own.
CARDS=(
"|Brand strategy + generative media production.|One human, many agents."
)

for row in "${CARDS[@]}"; do
  IFS='|' read -r slug line1 line2 <<< "$row"
  cat > "$TMP/$slug.html" <<EOF
<meta charset="utf-8">
<style>
  @font-face { font-family:"Oliveira"; src:url("oliveira.otf") format("opentype"); }
  * { margin:0; box-sizing:border-box; }
  body { width:1200px; height:630px; background:#FAF8F4; color:#0E0D0B;
         font-family:"Oliveira",Georgia,serif; display:flex; flex-direction:column;
         justify-content:space-between; padding:72px 80px; overflow:hidden; }
  .say { display:flex; flex-direction:column; gap:26px; }
  h1 { font-size:78px; line-height:1.14; letter-spacing:-0.018em;
       font-weight:normal; max-width:13em; text-wrap:balance; }
  .pos { font-family:ui-monospace,Menlo,monospace; font-size:26px;
         letter-spacing:0.12em; text-transform:uppercase; color:#8A8781; }
  /* the mark is drawn, not set: Oliveira's zero and its capital O are the same
     height and 6% apart in width, so 0xR set live in it reads OxR. */
  .top { height:40px; width:auto; align-self:flex-start; }
  .foot { display:flex; justify-content:flex-end; align-items:baseline;
          font-family:ui-monospace,Menlo,monospace; font-size:19px;
          letter-spacing:0.1em; text-transform:uppercase; color:#8A8781; }
  .foot b { font-family:ui-monospace,Menlo,monospace; font-size:19px;
              letter-spacing:0.1em; text-transform:none; color:#0E0D0B;
              font-weight:normal; white-space:nowrap; }
</style>
<img class="top" src="mark-0xr.svg" alt="0xR">
<div class="say"><h1>$line1</h1><p class="pos">$line2</p></div>
EOF
  ( cd "$TMP" && "$CHROME" --headless=new --disable-gpu --hide-scrollbars \
      --force-device-scale-factor=2 --virtual-time-budget=6000 \
      --window-size=1200,630 --screenshot="$slug.png" "$slug.html" >/dev/null 2>&1 )
  sips -s format jpeg -s formatOptions 86 -Z 1200 "$TMP/$slug.png" \
      --out "$OUT/card${slug:+-$slug}.jpg" >/dev/null
  printf "  card%-8s %5.0f KB\n" "${slug:+-$slug}.jpg" "$(($(stat -f%z "$OUT/card${slug:+-$slug}.jpg")/1024))"
done
