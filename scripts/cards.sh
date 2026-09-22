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
cp "$SITE/fonts/oliveira.otf" "$TMP/"

# slug | headline | footer-left
CARDS=(
"index|I run a creative studio of (&nbsp;one&nbsp;) human + {&nbsp;many&nbsp;}&nbsp;agents.|We do direction + production for brands, at a fraction of the time and cost of a media department."
"thesis|Every company becomes a media company.|Why the story is what is left to compete on."
"crew|They produce. I direct.|Six agents: brand / film / art direction / copywriting / product design / gtm"
"studio|The studio.|Brand / film / product / go-to-market, per company."
"more|More.|Press, live appearances and the long pieces."
)

for row in "${CARDS[@]}"; do
  IFS='|' read -r slug head foot <<< "$row"
  cat > "$TMP/$slug.html" <<EOF
<meta charset="utf-8">
<style>
  @font-face { font-family:"Oliveira"; src:url("oliveira.otf") format("opentype"); }
  * { margin:0; box-sizing:border-box; }
  body { width:1200px; height:630px; background:#FAF8F4; color:#0E0D0B;
         font-family:"Oliveira",Georgia,serif; display:flex; flex-direction:column;
         justify-content:space-between; padding:72px 80px; overflow:hidden; }
  h1 { font-size:78px; line-height:1.14; letter-spacing:-0.018em;
       font-weight:normal; max-width:15em; text-wrap:balance; }
  .top { font-family:"Oliveira",Georgia,serif; font-size:30px;
           letter-spacing:0; color:#8A8781; }
  /* Oliveira has no slashed zero, so 0xR set in it reads OxR. The zero comes
     from the mono; the letters stay in the display face. */
  .top i { font-family:ui-monospace,Menlo,monospace; font-style:normal;
           font-size:0.84em; letter-spacing:-0.02em; }
  .foot { display:flex; justify-content:space-between; align-items:baseline; gap:40px;
          font-family:ui-monospace,Menlo,monospace; font-size:19px;
          letter-spacing:0.1em; text-transform:uppercase; color:#8A8781; }
  .foot b { font-family:ui-monospace,Menlo,monospace; font-size:19px;
              letter-spacing:0.1em; text-transform:none; color:#0E0D0B;
              font-weight:normal; white-space:nowrap; }
</style>
<div class="top"><i>0</i>xR</div>
<h1>$head</h1>
<div class="foot"><span>$foot</span><b>0xr.io</b></div>
EOF
  ( cd "$TMP" && "$CHROME" --headless=new --disable-gpu --hide-scrollbars \
      --force-device-scale-factor=2 --virtual-time-budget=6000 \
      --window-size=1200,630 --screenshot="$slug.png" "$slug.html" >/dev/null 2>&1 )
  sips -s format jpeg -s formatOptions 86 -Z 1200 "$TMP/$slug.png" \
      --out "$OUT/card-$slug.jpg" >/dev/null
  printf "  card-%-6s %5.0f KB\n" "$slug.jpg" "$(($(stat -f%z "$OUT/card-$slug.jpg")/1024))"
done
